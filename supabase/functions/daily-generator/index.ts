import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Anthropic from "npm:@anthropic-ai/sdk";
import { parse } from "npm:@toon-format/toon@1.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey"
};
function levenshteinDistance(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const m = s1.length;
  const n = s2.length;
  const dp = [];
  for(let i = 0; i <= m; i++){
    dp[i] = [];
    dp[i][0] = i;
  }
  for(let j = 0; j <= n; j++){
    dp[0][j] = j;
  }
  for(let i = 1; i <= m; i++){
    for(let j = 1; j <= n; j++){
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1);
      }
    }
  }
  return dp[m][n];
}
function isSimilarToExisting(newTitle, existingTitles, threshold = 0.7) {
  const newTitleLower = newTitle.toLowerCase();
  for (const existingTitle of existingTitles){
    const existingLower = existingTitle.toLowerCase();
    if (newTitleLower.includes(existingLower) || existingLower.includes(newTitleLower)) {
      if (Math.abs(newTitleLower.length - existingLower.length) < 10) {
        return true;
      }
    }
    const maxLen = Math.max(newTitle.length, existingTitle.length);
    const distance = levenshteinDistance(newTitle, existingTitle);
    const similarity = 1 - distance / maxLen;
    if (similarity >= threshold) {
      return true;
    }
  }
  return false;
}
Deno.serve(async (req)=>{
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not found in environment variables");
    }
    console.log("Starting daily content generation...");
    console.log("Supabase URL:", supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    const anthropic = new Anthropic({
      apiKey: anthropicApiKey
    });
    console.log("Listing files in content-prompts bucket...");
    const { data: files, error: listError } = await supabase.storage.from("content-prompts").list("", {
      limit: 100,
      offset: 0,
      sortBy: {
        column: "name",
        order: "asc"
      }
    });
    if (listError) {
      console.error("List error:", listError);
      throw new Error("Failed to list prompt files: " + listError.message);
    }
    if (!files || files.length === 0) {
      console.log("No prompt files found in content-prompts bucket");
      return new Response(JSON.stringify({
        message: "No prompt files found",
        processed: 0
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    console.log("Found files:", files.length, files.map((f)=>f.name));
    const results = {
      totalFiles: files.length,
      processedFiles: 0,
      totalInserted: 0,
      errors: []
    };
    for (const file of files){
      if (!file.name || file.name.endsWith('/') || !file.name.endsWith(".txt")) {
        console.log("Skipping non-text file:", file.name);
        continue;
      }
      try {
        console.log("Processing file:", file.name);
        const { data: urlData } = supabase.storage.from("content-prompts").getPublicUrl(file.name);
        console.log("Public URL:", urlData.publicUrl);
        const { data: fileData, error: downloadError } = await supabase.storage.from("content-prompts").download(file.name);
        let promptText;
        if (downloadError) {
          console.error("Download error:", downloadError);
          console.log("Trying public URL fetch...");
          const response = await fetch(urlData.publicUrl);
          if (!response.ok) {
            throw new Error("Failed to fetch file: " + response.status);
          }
          promptText = await response.text();
          console.log("Fetched via public URL, length:", promptText.length);
        } else if (!fileData) {
          throw new Error("No data returned for file");
        } else {
          promptText = await fileData.text();
          console.log("Downloaded successfully, length:", promptText.length);
        }
        console.log("Loading recent posts for context...");
        const { data: recentPosts, error: queryError } = await supabase.from("post").select("title, summary").order("created_at", {
          ascending: false
        }).limit(50);
        if (queryError) {
          throw new Error("Failed to query recent posts: " + queryError.message);
        }
        const ignoreContext = recentPosts || [];
        const existingTitles = ignoreContext.map((p)=>p.title);
        const ignoreContextText = ignoreContext.map((p)=>"- " + p.title + ": " + (p.summary || "(no summary)").substring(0, 150)).join("\n");
        console.log("Loaded existing posts:", ignoreContext.length);
        let inserted_count = 0;
        let attempts = 0;
        const maxAttempts = 20;
        while(inserted_count < 5 && attempts < maxAttempts){
          attempts++;
          console.log("Attempt", attempts, "Need", 5 - inserted_count, "more posts");
          const systemPrompt = "You are a technical content generator. Your task is to generate coding tips/patterns in TOON (Token-Oriented Object Notation) format based on the user's prompt.\n\nIMPORTANT RULES:\n1. Return ONLY valid TOON with 3-5 tips\n2. Use @TIP to start each tip block\n3. Simple fields use: key: value\n4. Multiline text uses: key: <<<\n  content\n  more content\n>>>\n5. Arrays use:\n@ARRAY key_name\n- item1\n- item2\n@END_ARRAY\n6. Code snippets use:\n@CODE_SNIPPET\nlabel: Example\nlanguage: javascript\ncontent: <<<\ncode here\n>>>\n@END_CODE_SNIPPET\n\nEXAMPLE TOON FORMAT:\n\n@TIP\ntitle: Using Array.prototype.reduce() for Complex Aggregations\nsummary: Learn how to leverage reduce for powerful data transformations\nproblem_solved: Simplifies complex array transformations into single operations\nupside: More functional, chainable, and readable than imperative loops\ndownside: Can be harder to debug and may have performance overhead\nrisk_level: Low\nperformance_impact: Slightly slower than for loops for simple cases\ndoc_url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce\nprimary_topic: JavaScript\nsyntax: javascript\ncompatibility_min_version: ES5\ncompatibility_deprecated_in: \ndifficulty: Intermediate\n@ARRAY dependencies\n@END_ARRAY\n@ARRAY tags\n- functional-programming\n- arrays\n- reduce\n@END_ARRAY\n@CODE_SNIPPET\nlabel: Basic Example\nlanguage: javascript\ncontent: <<<\nconst numbers = [1, 2, 3, 4, 5];\nconst sum = numbers.reduce((acc, num) => acc + num, 0);\nconsole.log(sum); // 15\n>>>\n@END_CODE_SNIPPET\n\nDO NOT generate topics similar to these existing ones:\n" + ignoreContextText + "\n\nBe creative and diverse. Focus on different aspects, patterns, or technologies.\nReturn ONLY the TOON content, no additional text or markdown code blocks.";
          try {
            const message = await anthropic.messages.create({
              model: "claude-sonnet-4-20250514",
              max_tokens: 20000,
              temperature: 1,
              messages: [
                {
                  role: "user",
                  content: promptText
                }
              ],
              system: systemPrompt
            });
            const responseText = message.content[0].type === "text" ? message.content[0].text : "";
            console.log("Claude response preview:", responseText.substring(0, 150));
            let generatedTips;
            try {
              const toonMatch = responseText.match(/```(?:toon)?\s*([\s\S]*?)```/);
              const toonText = toonMatch ? toonMatch[1] : responseText;
              const parsed = parse(toonText.trim());
              generatedTips = parsed.TIP || [];
            } catch (parseError) {
              console.error("Parse error:", parseError);
              console.error("Response:", responseText.substring(0, 500));
              continue;
            }
            if (!Array.isArray(generatedTips)) {
              console.error("Failed to parse tips from TOON");
              continue;
            }
            console.log("Generated tips:", generatedTips.length);
            for (const tip of generatedTips){
              if (inserted_count >= 5) break;
              if (!tip.title) {
                console.log("Skipping tip without title");
                continue;
              }
              if (isSimilarToExisting(tip.title, existingTitles)) {
                console.log("Duplicate detected:", tip.title);
                continue;
              }
              const postData = {
                title: tip.title,
                summary: tip.summary,
                problem_solved: tip.problem_solved,
                upside: tip.upside,
                downside: tip.downside,
                risk_level: tip.risk_level,
                performance_impact: tip.performance_impact,
                doc_url: tip.doc_url,
                primary_topic: tip.primary_topic,
                syntax: tip.syntax,
                code_snippets: tip.code_snippets || [],
                dependencies: tip.dependencies || [],
                compatibility_min_version: tip.compatibility_min_version,
                compatibility_deprecated_in: tip.compatibility_deprecated_in,
                tags: tip.tags || [],
                last_verified: new Date().toISOString().split("T")[0],
                difficulty: tip.difficulty
              };
              const { error: insertError } = await supabase.from("post").insert(postData);
              if (insertError) {
                console.error("Insert error:", tip.title, insertError.message);
                continue;
              }
              console.log("Inserted:", tip.title);
              existingTitles.push(tip.title);
              inserted_count++;
              results.totalInserted++;
            }
          } catch (apiError) {
            console.error("API call failed:", apiError);
          }
        }
        if (inserted_count < 5) {
          console.warn("Only inserted", inserted_count, "of 5 posts for", file.name);
        } else {
          console.log("Successfully inserted 5 posts for", file.name);
        }
        results.processedFiles++;
      } catch (fileError) {
        const errorMsg = "Error processing " + file.name + ": " + (fileError instanceof Error ? fileError.message : String(fileError));
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }
    console.log("Content generation completed");
    console.log("Processed:", results.processedFiles, "of", results.totalFiles);
    console.log("Total inserted:", results.totalInserted);
    if (results.errors.length > 0) {
      console.log("Errors:", results.errors);
    }
    return new Response(JSON.stringify({
      success: true,
      ...results,
      message: "Processed " + results.processedFiles + " files, inserted " + results.totalInserted + " posts"
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Fatal error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});