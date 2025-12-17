import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey"
};

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

function isSimilarToExisting(newQuestion: string, existingQuestions: string[], threshold = 0.7): boolean {
  const newQuestionLower = newQuestion.toLowerCase();
  for (const existingQuestion of existingQuestions) {
    const existingLower = existingQuestion.toLowerCase();
    if (newQuestionLower.includes(existingLower) || existingLower.includes(newQuestionLower)) {
      if (Math.abs(newQuestionLower.length - existingLower.length) < 10) {
        return true;
      }
    }
    const maxLen = Math.max(newQuestion.length, existingQuestion.length);
    const distance = levenshteinDistance(newQuestion, existingQuestion);
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
    const pollsPerFile = parseInt(Deno.env.get("POLLS_PER_FILE") || "3");

    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not found in environment variables");
    }

    console.log("Starting poll generation...");
    console.log("Polls per file:", pollsPerFile);

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const anthropic = new Anthropic({
      apiKey: anthropicApiKey
    });

    console.log("Listing files in content-polls bucket...");
    const { data: files, error: listError } = await supabase.storage
      .from("content-polls")
      .list("", {
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "asc" }
      });

    if (listError) {
      console.error("List error:", listError);
      throw new Error("Failed to list poll prompt files: " + listError.message);
    }

    if (!files || files.length === 0) {
      console.log("No prompt files found in content-polls bucket");
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

    console.log("Loading all poll prompt files...");
    const promptContents: string[] = [];

    for (const file of textFiles) {
      try {
        const { data: urlData } = supabase.storage
          .from("content-polls")
          .getPublicUrl(file.name);

        const { data: fileData, error: downloadError } = await supabase.storage
          .from("content-polls")
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
      throw new Error("Failed to load any poll prompt files");
    }

    console.log("Loading recent polls for duplicate detection...");
    const { data: recentPolls, error: queryError } = await supabase
      .from("polls")
      .select("question")
      .order("created_at", { ascending: false })
      .limit(50);

    if (queryError) {
      throw new Error("Failed to query recent polls: " + queryError.message);
    }

    const existingQuestions = (recentPolls || []).map((p: any) => p.question);
    const ignoreContextText = existingQuestions.length > 0 
      ? (recentPolls || []).map((p: any) => "- " + p.question).join("\n")
      : "(No existing polls yet)";

    const totalPollsNeeded = promptContents.length * pollsPerFile;
    console.log("Requesting", totalPollsNeeded, "polls from Claude API...");

    const combinedPrompts = promptContents.map((content, idx) =>
      `\n--- PROMPT ${idx + 1} ---\n${content}\n--- END PROMPT ${idx + 1} ---\n`
    ).join("\n");

    const systemPrompt = `You are a poll question generator for developers. Your output must be ONLY valid JSON with no additional text.

CRITICAL OUTPUT REQUIREMENTS:
- Start your response immediately with the opening brace {
- End your response with the closing brace }
- Do NOT include markdown code fences
- Do NOT include any explanatory text
- Do NOT include comments

Generate exactly ${totalPollsNeeded} engaging poll questions.

Schema for each poll:
{
  "type": "question",
  "question": "The text of the poll question",
  "options": [
    "Option A text",
    "Option B text",
    "Option C text",
    "Option D text"
  ],
  "answer": "The Correct/Best Practice answer. exact copy of option that is correct.",
  "topic": "The broad category",
  "technology": "The specific language or stack",
  "difficulty": "Beginner | Junior | Senior"
}

REQUIREMENTS:
- Generate EXACTLY ${totalPollsNeeded} polls
- Each poll must have 2-6 options
- Questions should be concise and relevant to developers
- Options should be mutually exclusive
- Response format: {"polls": [...]}

DO NOT generate questions similar to:
${ignoreContextText}

Your entire response must be valid JSON.`;

    console.log("Calling Claude API with streaming...");
    const stream = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
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

    let generatedPolls: any[];
    try {
      let jsonText = responseText.trim();

      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        console.log("Found markdown code fence, extracting JSON...");
        jsonText = jsonMatch[1].trim();
      }

      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
      }

      console.log("Attempting to parse JSON, length:", jsonText.length);
      console.log("JSON to parse (first 200 chars):", jsonText.substring(0, 200));

      const parsed = JSON.parse(jsonText);
      console.log("Parsed object keys:", Object.keys(parsed));

      if (parsed.polls && Array.isArray(parsed.polls)) {
        generatedPolls = parsed.polls;
      } else if (parsed.type === "question" || (parsed.question && parsed.options)) {
        console.log("Detected single poll format, wrapping in array");
        generatedPolls = [parsed];
      } else if (Array.isArray(parsed)) {
        console.log("Detected array of polls");
        generatedPolls = parsed;
      } else {
        generatedPolls = [];
      }

      console.log("Parsed polls count:", generatedPolls.length);

      if (generatedPolls.length > 0) {
        console.log("First poll sample:", JSON.stringify(generatedPolls[0], null, 2));
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      console.error("Failed text sample (first 1000 chars):", responseText.substring(0, 1000));
      throw new Error("Failed to parse Claude response as JSON: " + (parseError instanceof Error ? parseError.message : String(parseError)));
    }

    if (!Array.isArray(generatedPolls) || generatedPolls.length === 0) {
      console.error("No polls in generated response. Full response:", responseText);
      throw new Error("No polls generated from Claude API. Check logs for details.");
    }

    console.log("Filtering and validating polls...");
    const allExistingQuestions = [...existingQuestions];
    const validPolls: any[] = [];

    for (const poll of generatedPolls) {
      if (!poll.question || !poll.options || !Array.isArray(poll.options) || poll.options.length < 2) {
        console.log("Skipping poll with invalid structure:", JSON.stringify(poll));
        continue;
      }

      if (isSimilarToExisting(poll.question, allExistingQuestions)) {
        console.log("Duplicate detected, skipping:", poll.question);
        continue;
      }

      const normalizedOptions = poll.options.map((opt: any, idx: number) => {
        if (typeof opt === 'string') {
          return { text: opt, order: idx };
        } else if (opt.text) {
          return { text: opt.text, order: opt.order !== undefined ? opt.order : idx };
        }
        return null;
      }).filter((opt: any) => opt !== null);

      if (normalizedOptions.length < 2) {
        console.log("Skipping poll with insufficient valid options:", JSON.stringify(poll));
        continue;
      }

      validPolls.push({
        ...poll,
        options: normalizedOptions
      });
      allExistingQuestions.push(poll.question);
    }

    console.log("Valid polls after filtering:", validPolls.length);

    if (validPolls.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No unique polls to insert (all were duplicates or invalid)",
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

    console.log("Inserting polls and options...");
    let insertedCount = 0;

    for (const poll of validPolls) {
      try {
        const { data: insertedPoll, error: pollError } = await supabase
          .from("polls")
          .insert({
            question: poll.question,
            description: poll.description || null,
            category: poll.category || null,
            is_active: true
          })
          .select()
          .single();

        if (pollError) {
          console.error("Failed to insert poll:", poll.question, pollError);
          continue;
        }

        const options = poll.options.map((opt: any, idx: number) => ({
          poll_id: insertedPoll.id,
          option_text: opt.text,
          option_order: opt.order !== undefined ? opt.order : idx
        }));

        const { error: optionsError } = await supabase
          .from("poll_options")
          .insert(options);

        if (optionsError) {
          console.error("Failed to insert options for poll:", poll.question, optionsError);
          await supabase.from("polls").delete().eq("id", insertedPoll.id);
          continue;
        }

        insertedCount++;
        console.log(`Successfully inserted poll ${insertedCount}/${validPolls.length}:`, poll.question);
      } catch (err) {
        console.error("Error inserting poll:", err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      totalInserted: insertedCount,
      processedFiles: textFiles.length,
      message: `Processed ${textFiles.length} files, inserted ${insertedCount} polls`
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
