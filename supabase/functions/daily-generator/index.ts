import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey"
};

const COLOR_PALETTE = [
  { from: 'cyan-500', to: 'blue-500', hoverFrom: 'cyan-400', hoverTo: 'blue-400' },
  { from: 'orange-500', to: 'red-500', hoverFrom: 'orange-400', hoverTo: 'red-400' },
  { from: 'teal-500', to: 'cyan-500', hoverFrom: 'teal-400', hoverTo: 'cyan-400' },
  { from: 'emerald-500', to: 'green-500', hoverFrom: 'emerald-400', hoverTo: 'green-400' },
  { from: 'amber-500', to: 'orange-500', hoverFrom: 'amber-400', hoverTo: 'orange-400' },
  { from: 'sky-500', to: 'blue-500', hoverFrom: 'sky-400', hoverTo: 'blue-400' },
  { from: 'rose-500', to: 'pink-500', hoverFrom: 'rose-400', hoverTo: 'pink-400' },
  { from: 'green-500', to: 'teal-500', hoverFrom: 'green-400', hoverTo: 'teal-400' },
  { from: 'yellow-500', to: 'amber-500', hoverFrom: 'yellow-400', hoverTo: 'amber-400' },
  { from: 'lime-500', to: 'green-500', hoverFrom: 'lime-400', hoverTo: 'green-400' },
  { from: 'blue-500', to: 'cyan-500', hoverFrom: 'blue-400', hoverTo: 'cyan-400' },
  { from: 'red-500', to: 'orange-500', hoverFrom: 'red-400', hoverTo: 'orange-400' },
  { from: 'pink-500', to: 'rose-500', hoverFrom: 'pink-400', hoverTo: 'rose-400' },
  { from: 'teal-500', to: 'emerald-500', hoverFrom: 'teal-400', hoverTo: 'emerald-400' },
  { from: 'cyan-500', to: 'sky-500', hoverFrom: 'cyan-400', hoverTo: 'sky-400' },
  { from: 'fuchsia-500', to: 'pink-500', hoverFrom: 'fuchsia-400', hoverTo: 'pink-400' },
  { from: 'emerald-500', to: 'teal-500', hoverFrom: 'emerald-400', hoverTo: 'teal-400' },
  { from: 'amber-500', to: 'yellow-500', hoverFrom: 'amber-400', hoverTo: 'yellow-400' },
  { from: 'blue-500', to: 'sky-500', hoverFrom: 'blue-400', hoverTo: 'sky-400' },
  { from: 'red-500', to: 'rose-500', hoverFrom: 'red-400', hoverTo: 'rose-400' },
  { from: 'green-500', to: 'emerald-500', hoverFrom: 'green-400', hoverTo: 'emerald-400' },
  { from: 'fuchsia-500', to: 'rose-500', hoverFrom: 'fuchsia-400', hoverTo: 'rose-400' },
  { from: 'sky-500', to: 'cyan-500', hoverFrom: 'sky-400', hoverTo: 'cyan-400' },
  { from: 'lime-500', to: 'yellow-500', hoverFrom: 'lime-400', hoverTo: 'yellow-400' },
];

async function ensureTopicsBulk(supabase: any, topicNames: string[]) {
  console.log("ensureTopicsBulk called with:", topicNames);
  if (!topicNames || topicNames.length === 0) {
    console.log("No topics to ensure, returning early");
    return;
  }

  const uniqueTopics = [...new Set(topicNames.filter(name => name))];
  console.log("Unique topics to process:", uniqueTopics);

  const { data: existingTopics, error: selectError } = await supabase
    .from('topics')
    .select('name, id')
    .in('name', uniqueTopics);

  if (selectError) {
    console.error("Error fetching existing topics:", JSON.stringify(selectError, null, 2));
  } else {
    console.log("Existing topics found:", existingTopics);
  }

  const existingNames = new Set(existingTopics?.map((t: any) => t.name) || []);
  const topicsToCreate = uniqueTopics.filter(name => !existingNames.has(name));

  console.log("Topics to create:", topicsToCreate);
  if (topicsToCreate.length === 0) {
    console.log("All topics already exist, no creation needed");
    return;
  }

  const { data: allTopics, error: countError } = await supabase
    .from('topics')
    .select('id');

  if (countError) {
    console.error("Error counting topics:", JSON.stringify(countError, null, 2));
  }

  let startingIndex = allTopics?.length || 0;
  console.log("Starting index for color assignment:", startingIndex);

  const newTopics = topicsToCreate.map((name, idx) => {
    const colorIndex = (startingIndex + idx) % COLOR_PALETTE.length;
    const colors = COLOR_PALETTE[colorIndex];
    return {
      name,
      gradient_from: colors.from,
      gradient_to: colors.to,
      hover_gradient_from: colors.hoverFrom,
      hover_gradient_to: colors.hoverTo,
    };
  });

  console.log("Inserting new topics:", JSON.stringify(newTopics, null, 2));

  const { data: insertedTopics, error: insertError } = await supabase
    .from('topics')
    .insert(newTopics)
    .select();

  if (insertError) {
    console.error("Error inserting topics:", JSON.stringify(insertError, null, 2));
  } else {
    console.log("Successfully inserted topics:", insertedTopics);
  }
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
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1);
      }
    }
  }
  return dp[m][n];
}

function isSimilarToExisting(newTitle: string, existingTitles: string[], threshold = 0.7): boolean {
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

Deno.serve(async (req) => {
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
    const postsPerFile = parseInt(Deno.env.get("POSTS_PER_FILE") || "5");

    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not found in environment variables");
    }

    console.log("Starting daily content generation...");
    console.log("Posts per file:", postsPerFile);

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const anthropic = new Anthropic({
      apiKey: anthropicApiKey
    });

    console.log("Listing files in content-prompts bucket...");
    const { data: files, error: listError } = await supabase.storage
      .from("content-prompts")
      .list("", {
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "asc" }
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

    const textFiles = files.filter(f => f.name && !f.name.endsWith('/') && f.name.endsWith(".txt"));
    console.log("Found text files:", textFiles.length, textFiles.map(f => f.name));

    if (textFiles.length === 0) {
      return new Response(JSON.stringify({
        message: "No valid text files found",
        processed: 0
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    console.log("Loading all prompt files...");
    const promptContents: string[] = [];

    for (const file of textFiles) {
      try {
        const { data: urlData } = supabase.storage
          .from("content-prompts")
          .getPublicUrl(file.name);

        const { data: fileData, error: downloadError } = await supabase.storage
          .from("content-prompts")
          .download(file.name);

        let promptText: string;
        if (downloadError) {
          console.log("Trying public URL fetch for:", file.name);
          const response = await fetch(urlData.publicUrl);
          if (!response.ok) {
            throw new Error("Failed to fetch file: " + response.status);
          }
          promptText = await response.text();
        } else if (!fileData) {
          throw new Error("No data returned for file");
        } else {
          promptText = await fileData.text();
        }

        promptContents.push(promptText);
        console.log("Loaded:", file.name, "length:", promptText.length);
      } catch (fileError) {
        console.error("Error loading file", file.name, fileError);
      }
    }

    if (promptContents.length === 0) {
      throw new Error("Failed to load any prompt files");
    }

    console.log("Loading recent posts for duplicate detection...");
    const { data: recentPosts, error: queryError } = await supabase
      .from("post")
      .select("title, summary")
      .order("created_at", { ascending: false })
      .limit(100);

    if (queryError) {
      throw new Error("Failed to query recent posts: " + queryError.message);
    }

    const existingTitles = (recentPosts || []).map((p: any) => p.title);
    const ignoreContextText = (recentPosts || [])
      .map((p: any) => "- " + p.title + ": " + (p.summary || "(no summary)").substring(0, 150))
      .join("\n");

    const totalPostsNeeded = promptContents.length * postsPerFile;
    console.log("Requesting", totalPostsNeeded, "posts from Claude API...");

    const combinedPrompts = promptContents.map((content, idx) =>
      `\n--- PROMPT ${idx + 1} ---\n${content}\n--- END PROMPT ${idx + 1} ---\n`
    ).join("\n");

    const systemPrompt = `You are a technical content generator. Your output must be ONLY valid JSON with no additional text or formatting.

CRITICAL OUTPUT REQUIREMENTS:
- Start your response immediately with the opening brace {
- End your response with the closing brace }
- Do NOT include markdown code fences like \`\`\`json or \`\`\`
- Do NOT include any explanatory text before or after the JSON
- Do NOT include comments in the JSON

Generate a JSON object with a "tips" property containing exactly ${totalPostsNeeded} objects.

Schema for each tip:
{
  "title": "string - clear, concise title",
  "summary": "string - brief description",
  "problem_solved": "string - what problem this solves",
  "upside": "string - benefits and advantages",
  "downside": "string - drawbacks or limitations",
  "risk_level": "Low|Medium|High",
  "performance_impact": "string - performance considerations",
  "doc_url": "string or null - documentation URL",
  "primary_topic": "string - main technology/concept",
  "syntax": "string - programming language",
  "code_snippets": [{"label": "string", "language": "string", "content": "string"}],
  "dependencies": ["string array - required dependencies"],
  "compatibility_min_version": "string or null",
  "compatibility_deprecated_in": "string or null",
  "tags": ["string array - relevant tags"],
  "difficulty": "Beginner|Intermediate|Advanced"
}

REQUIREMENTS:
- Generate EXACTLY ${totalPostsNeeded} tips (${postsPerFile} per prompt)
- All tips must be unique and diverse
- Response format: {"tips": [...]}

DO NOT generate topics similar to:
${ignoreContextText}

Your entire response must be valid JSON that can be directly passed to JSON.parse().`;

    console.log("Calling Claude API with streaming...");
    const stream = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 50000,
      stream: true,
      temperature: 1,
      messages: [
        {
          role: "user",
          content: combinedPrompts
        }
      ],
      system: systemPrompt
    });

    console.log("Collecting streamed response...");
    let responseText = "";
    let chunkCount = 0;

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        responseText += event.delta.text;
        chunkCount++;
        if (chunkCount % 10 === 0) {
          console.log(`Collected ${chunkCount} chunks, length: ${responseText.length}`);
        }
      }
    }

    console.log("Stream complete. Total chunks:", chunkCount);
    console.log("Claude response text length:", responseText.length);
    console.log("First 500 chars:", responseText.substring(0, 500));
    console.log("Last 500 chars:", responseText.substring(Math.max(0, responseText.length - 500)));

    if (!responseText) {
      throw new Error("No content received from Claude API stream");
    }

    let generatedTips: any[];
    try {
      let jsonText = responseText.trim();

      // Try to extract JSON from markdown code blocks
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }

      // Remove any leading/trailing text that isn't JSON
      // Find the first { and last }
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
      }

      console.log("Attempting to parse JSON, length:", jsonText.length);
      console.log("First 200 chars of extracted JSON:", jsonText.substring(0, 200));

      const parsed = JSON.parse(jsonText);
      generatedTips = parsed.tips || [];
      console.log("Parsed tips:", generatedTips.length);
    } catch (parseError) {
      console.error("Parse error:", parseError);
      console.error("Failed text sample:", responseText.substring(0, 1000));
      throw new Error("Failed to parse Claude response as JSON: " + (parseError instanceof Error ? parseError.message : String(parseError)));
    }

    if (!Array.isArray(generatedTips) || generatedTips.length === 0) {
      throw new Error("No tips generated from Claude API");
    }

    console.log("Filtering and validating posts...");
    const allExistingTitles = [...existingTitles];
    const validPosts: any[] = [];

    for (const tip of generatedTips) {
      if (!tip.title) {
        console.log("Skipping tip without title");
        continue;
      }

      if (isSimilarToExisting(tip.title, allExistingTitles)) {
        console.log("Duplicate detected, skipping:", tip.title);
        continue;
      }

      validPosts.push({
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
      });

      allExistingTitles.push(tip.title);
    }

    console.log("Valid posts after filtering:", validPosts.length);

    if (validPosts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No unique posts to insert (all were duplicates)",
        totalInserted: 0,
        processedFiles: textFiles.length
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    const uniqueTopics = [...new Set(validPosts.map(p => p.primary_topic).filter(t => t))];
    console.log("Creating topics:", uniqueTopics.length, uniqueTopics);
    await ensureTopicsBulk(supabase, uniqueTopics);

    console.log("Attempting bulk insert of", validPosts.length, "posts...");
    console.log("Sample post structure:", JSON.stringify(validPosts[0], null, 2));

    const { data: insertData, error: bulkError } = await supabase
      .from("post")
      .insert(validPosts)
      .select();

    let insertedCount = 0;
    let bulkInserted = false;

    if (!bulkError) {
      console.log("Bulk insert successful!");
      console.log("Inserted data:", insertData);
      insertedCount = validPosts.length;
      bulkInserted = true;
    } else {
      console.warn("Bulk insert failed:", JSON.stringify(bulkError, null, 2));
      console.log("Error code:", bulkError.code);
      console.log("Error message:", bulkError.message);
      console.log("Error details:", bulkError.details);
      console.log("Falling back to individual inserts...");

      for (let i = 0; i < validPosts.length; i++) {
        const post = validPosts[i];
        console.log(`Attempting insert ${i + 1}/${validPosts.length}: ${post.title}`);

        const { data: singleData, error: insertError } = await supabase
          .from("post")
          .insert(post)
          .select();

        if (insertError) {
          console.error(`Failed to insert post ${i + 1}:`, post.title);
          console.error("Error details:", JSON.stringify(insertError, null, 2));
          console.error("Post data:", JSON.stringify(post, null, 2));
        } else {
          insertedCount++;
          console.log(`Successfully inserted ${i + 1}/${validPosts.length}:`, post.title);
          console.log("Inserted data:", singleData);
        }
      }

      console.log("Individual inserts completed:", insertedCount, "of", validPosts.length);
    }

    return new Response(JSON.stringify({
      success: true,
      totalInserted: insertedCount,
      processedFiles: textFiles.length,
      bulkInserted,
      message: `Processed ${textFiles.length} files, inserted ${insertedCount} posts`
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
