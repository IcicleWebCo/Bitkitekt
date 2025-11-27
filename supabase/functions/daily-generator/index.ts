import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Anthropic from "npm:@anthropic-ai/sdk@0.30.1";
import { parse as parseToml } from "jsr:@std/toml@1.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PostRecord {
  id?: string;
  title: string;
  summary?: string;
  problem_solved?: string;
  upside?: string;
  downside?: string;
  risk_level?: "Low" | "Medium" | "High";
  performance_impact?: string;
  doc_url?: string;
  primary_topic?: string;
  syntax?: string;
  code_snippets?: any[];
  dependencies?: string[];
  compatibility_min_version?: string;
  compatibility_deprecated_in?: string;
  tags?: string[];
  last_verified?: string;
  difficulty?: string;
}

interface ClaudeResponse {
  title: string;
  summary?: string;
  problem_solved?: string;
  upside?: string;
  downside?: string;
  risk_level?: "Low" | "Medium" | "High";
  performance_impact?: string;
  doc_url?: string;
  primary_topic?: string;
  syntax?: string;
  code_snippets?: any[];
  dependencies?: string[];
  compatibility_min_version?: string;
  compatibility_deprecated_in?: string;
  tags?: string[];
  difficulty?: string;
}

function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }

  return dp[m][n];
}

function isSimilarToExisting(
  newTitle: string,
  existingTitles: string[],
  threshold = 0.7
): boolean {
  const newTitleLower = newTitle.toLowerCase();
  
  for (const existingTitle of existingTitles) {
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

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not found in environment variables");
    }

    console.log("Starting daily content generation...");
    console.log("Supabase URL:", supabaseUrl);

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    console.log("Listing files in content-prompts bucket...");
    const { data: files, error: listError } = await supabase.storage
      .from("content-prompts")
      .list("", {
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

    if (listError) {
      console.error("List error:", listError);
      throw new Error("Failed to list prompt files: " + listError.message);
    }

    if (!files || files.length === 0) {
      console.log("No prompt files found in content-prompts bucket");
      return new Response(
        JSON.stringify({ message: "No prompt files found", processed: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Found files:", files.length, files.map(f => f.name));

    const results = {
      totalFiles: files.length,
      processedFiles: 0,
      totalInserted: 0,
      errors: [] as string[],
    };

    for (const file of files) {
      if (!file.name || file.name.endsWith('/') || !file.name.endsWith(".txt")) {
        console.log("Skipping non-text file:", file.name);
        continue;
      }

      try {
        console.log("Processing file:", file.name);

        const { data: urlData } = supabase.storage
          .from("content-prompts")
          .getPublicUrl(file.name);
        
        console.log("Public URL:", urlData.publicUrl);
        
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("content-prompts")
          .download(file.name);

        let promptText: string;

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
        const { data: recentPosts, error: queryError } = await supabase
          .from("post")
          .select("title, summary")
          .order("created_at", { ascending: false })
          .limit(50);

        if (queryError) {
          throw new Error("Failed to query recent posts: " + queryError.message);
        }

        const ignoreContext = recentPosts || [];
        const existingTitles = ignoreContext.map((p) => p.title);
        
        const ignoreContextText = ignoreContext
          .map((p) => "- " + p.title + ": " + (p.summary || "(no summary)").substring(0, 150))
          .join("\n");

        console.log("Loaded existing posts:", ignoreContext.length);

        let inserted_count = 0;
        let attempts = 0;
        const maxAttempts = 20;

        while (inserted_count < 5 && attempts < maxAttempts) {
          attempts++;
          console.log("Attempt", attempts, "Need", 5 - inserted_count, "more posts");

          const systemPrompt = "You are a technical content generator. Your task is to generate coding tips/patterns in TOML format based on the user's prompt.\n\nIMPORTANT RULES:\n1. Return ONLY valid TOML with 3-5 [[tip]] sections\n2. Each [[tip]] section must follow this exact structure:\n\n[[tip]]\ntitle = \"Clear, descriptive title\"\nsummary = \"Brief 1-2 sentence overview\"\nproblem_solved = \"What problem does this solve?\"\nupside = \"Benefits and advantages\"\ndownside = \"Limitations and trade-offs\"\nrisk_level = \"Low\" # or Medium or High\nperformance_impact = \"Description of performance implications\"\ndoc_url = \"https://example.com/docs\"\nprimary_topic = \"JavaScript\"\nsyntax = \"javascript\"\ndependencies = [\"dep1\", \"dep2\"]\ncompatibility_min_version = \"1.0.0\"\ncompatibility_deprecated_in = \"\"\ntags = [\"tag1\", \"tag2\"]\ndifficulty = \"Intermediate\"\n\n[[tip.code_snippets]]\nlabel = \"Example\"\nlanguage = \"javascript\"\ncontent = \"\"\"\ncode here\n\"\"\"\n\n3. DO NOT generate topics similar to these existing ones:\n" + ignoreContextText + "\n\n4. Be creative and diverse. Focus on different aspects, patterns, or technologies.\n5. Return ONLY the TOML content, no additional text or markdown code blocks.";

          try {
            const message = await anthropic.messages.create({
              model: "claude-3-5-sonnet-20241022",
              max_tokens: 4096,
              temperature: 0.9,
              messages: [
                {
                  role: "user",
                  content: promptText,
                },
              ],
              system: systemPrompt,
            });

            const responseText = message.content[0].type === "text" 
              ? message.content[0].text 
              : "";

            console.log("Claude response preview:", responseText.substring(0, 150));

            let generatedTips: ClaudeResponse[];
            try {
              const tomlMatch = responseText.match(/```(?:toml)?\s*([\s\S]*?)```/);
              const tomlText = tomlMatch ? tomlMatch[1] : responseText;
              const parsed = parseToml(tomlText.trim()) as { tip: ClaudeResponse[] };
              generatedTips = parsed.tip || [];
            } catch (parseError) {
              console.error("Parse error:", parseError);
              console.error("Response:", responseText.substring(0, 500));
              continue;
            }

            if (!Array.isArray(generatedTips)) {
              console.error("Claude response does not contain tip array");
              continue;
            }

            console.log("Generated tips:", generatedTips.length);

            for (const tip of generatedTips) {
              if (inserted_count >= 5) break;

              if (!tip.title) {
                console.log("Skipping tip without title");
                continue;
              }

              if (isSimilarToExisting(tip.title, existingTitles)) {
                console.log("Duplicate detected:", tip.title);
                continue;
              }

              const postData: PostRecord = {
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
                difficulty: tip.difficulty,
              };

              const { error: insertError } = await supabase
                .from("post")
                .insert(postData);

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

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        message: "Processed " + results.processedFiles + " files, inserted " + results.totalInserted + " posts",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Fatal error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
