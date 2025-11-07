import { NextRequest, NextResponse } from 'next/server';

interface VideoInfo {
  title: string;
  description: string;
  tags: string[];
  viewCount?: string;
  likeCount?: string;
}

interface ChannelAnalysis {
  channelName: string;
  videos: VideoInfo[];
  patterns: {
    titlePatterns: string[];
    descriptionPatterns: string[];
    commonTags: string[];
  };
}

async function extractVideoId(url: string): Promise<string | null> {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function extractChannelId(url: string): Promise<string | null> {
  const patterns = [
    /youtube\.com\/@([^\/\n?#]+)/,
    /youtube\.com\/channel\/([^\/\n?#]+)/,
    /youtube\.com\/c\/([^\/\n?#]+)/,
    /youtube\.com\/user\/([^\/\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function fetchYouTubeData(url: string, type: 'video' | 'channel'): Promise<any> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();

    // Extract initial data from YouTube page
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});/);

    if (!ytInitialDataMatch) {
      return { html, parsed: null };
    }

    try {
      const data = JSON.parse(ytInitialDataMatch[1]);
      return { html, parsed: data };
    } catch (e) {
      return { html, parsed: null };
    }
  } catch (error) {
    console.error('Error fetching YouTube data:', error);
    return { html: '', parsed: null };
  }
}

async function analyzeChannelWithAI(channelUrl: string): Promise<ChannelAnalysis> {
  const channelId = await extractChannelId(channelUrl);

  if (!channelId) {
    throw new Error('Invalid channel URL');
  }

  const { html, parsed } = await fetchYouTubeData(channelUrl, 'channel');

  // Extract video information from the HTML
  const videoTitles: string[] = [];
  const videoDescriptions: string[] = [];
  const allTags: string[] = [];

  // Extract titles from HTML
  const titleMatches = html.matchAll(/"title":\s*{\s*"runs":\s*\[\s*{\s*"text":\s*"([^"]+)"/g);
  for (const match of titleMatches) {
    if (match[1] && !match[1].includes('@') && match[1].length > 10) {
      videoTitles.push(match[1]);
    }
  }

  // Extract from accessibility labels which often contain video titles
  const ariaLabelMatches = html.matchAll(/"ariaLabel":\s*"([^"]+)"/g);
  for (const match of ariaLabelMatches) {
    if (match[1] && match[1].length > 20 && match[1].length < 200) {
      const cleaned = match[1].replace(/by .+ \d+ .+ago/i, '').trim();
      if (cleaned.length > 10) {
        videoTitles.push(cleaned);
      }
    }
  }

  // Extract descriptions from various possible locations
  const descMatches = html.matchAll(/"description":\s*{\s*"simpleText":\s*"([^"]+)"/g);
  for (const match of descMatches) {
    if (match[1] && match[1].length > 20) {
      videoDescriptions.push(match[1]);
    }
  }

  // Extract hashtags
  const hashtagMatches = html.matchAll(/#[\w\u0600-\u06FF]+/g);
  for (const match of hashtagMatches) {
    allTags.push(match[0]);
  }

  // Get unique items
  const uniqueTitles = [...new Set(videoTitles)].slice(0, 10);
  const uniqueDescriptions = [...new Set(videoDescriptions)].slice(0, 10);
  const uniqueTags = [...new Set(allTags)].slice(0, 20);

  return {
    channelName: channelId,
    videos: uniqueTitles.map((title, i) => ({
      title,
      description: uniqueDescriptions[i] || '',
      tags: uniqueTags.slice(i * 3, i * 3 + 3)
    })),
    patterns: {
      titlePatterns: uniqueTitles,
      descriptionPatterns: uniqueDescriptions,
      commonTags: uniqueTags
    }
  };
}

async function getVideoInfoFromHTML(videoUrl: string): Promise<VideoInfo> {
  const { html } = await fetchYouTubeData(videoUrl, 'video');

  // Extract title
  let title = '';
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  if (titleMatch) {
    title = titleMatch[1].replace(' - YouTube', '').trim();
  }

  // Extract description from meta tags
  let description = '';
  const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
  if (descMatch) {
    description = descMatch[1];
  }

  // Extract keywords/tags
  const tags: string[] = [];
  const keywordsMatch = html.match(/<meta name="keywords" content="([^"]+)"/);
  if (keywordsMatch) {
    tags.push(...keywordsMatch[1].split(',').map((t: string) => t.trim()));
  }

  // Extract hashtags from description
  const hashtagMatches = html.matchAll(/#[\w\u0600-\u06FF]+/g);
  for (const match of hashtagMatches) {
    tags.push(match[0]);
  }

  return {
    title,
    description,
    tags: [...new Set(tags)].slice(0, 15)
  };
}

async function generateSEOWithAI(
  targetVideoInfo: VideoInfo,
  channelAnalyses: ChannelAnalysis[]
): Promise<{ title: string; description: string; tags: string[] }> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `You are a YouTube SEO expert. Analyze these successful channels and generate optimized SEO for a target video.

REFERENCE CHANNELS ANALYSIS:

${channelAnalyses.map((analysis, i) => `
Channel ${i + 1}: ${analysis.channelName}

Sample Titles:
${analysis.patterns.titlePatterns.slice(0, 8).map(t => `- ${t}`).join('\n')}

Sample Descriptions:
${analysis.patterns.descriptionPatterns.slice(0, 5).map(d => `- ${d}`).join('\n')}

Common Tags/Hashtags:
${analysis.patterns.commonTags.slice(0, 15).join(', ')}
`).join('\n---\n')}

TARGET VIDEO TO OPTIMIZE:
Original Title: ${targetVideoInfo.title}
Original Description: ${targetVideoInfo.description}
Original Tags: ${targetVideoInfo.tags.join(', ')}

TASK:
Based on the patterns from the successful channels above, generate:
1. An optimized title (should follow similar style and structure as the reference channels)
2. An optimized description (should follow similar format and include relevant hashtags)
3. Optimized tags/hashtags (mix of popular ones from reference channels and relevant ones for this video)

Return your response in this EXACT JSON format:
{
  "title": "optimized title here",
  "description": "optimized description here with hashtags",
  "tags": ["tag1", "tag2", "tag3"]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a YouTube SEO expert. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extract JSON from response (in case there's extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      title: result.title,
      description: result.description,
      tags: result.tags
    };
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referenceChannels, targetVideo } = body;

    if (!referenceChannels || !Array.isArray(referenceChannels) || referenceChannels.length === 0) {
      return NextResponse.json(
        { error: 'Please provide reference channel URLs' },
        { status: 400 }
      );
    }

    if (!targetVideo) {
      return NextResponse.json(
        { error: 'Please provide a target video URL' },
        { status: 400 }
      );
    }

    // Analyze reference channels
    const channelAnalyses: ChannelAnalysis[] = [];

    for (const channelUrl of referenceChannels) {
      try {
        const analysis = await analyzeChannelWithAI(channelUrl);
        channelAnalyses.push(analysis);
      } catch (error) {
        console.error(`Error analyzing channel ${channelUrl}:`, error);
      }
    }

    if (channelAnalyses.length === 0) {
      return NextResponse.json(
        { error: 'Failed to analyze any reference channels' },
        { status: 500 }
      );
    }

    // Get target video info
    const targetVideoInfo = await getVideoInfoFromHTML(targetVideo);

    // Generate optimized SEO
    const optimizedSEO = await generateSEOWithAI(targetVideoInfo, channelAnalyses);

    return NextResponse.json({
      success: true,
      original: targetVideoInfo,
      optimized: optimizedSEO,
      channelAnalyses: channelAnalyses.map(ca => ({
        channelName: ca.channelName,
        sampleTitles: ca.patterns.titlePatterns.slice(0, 5),
        sampleTags: ca.patterns.commonTags.slice(0, 10)
      }))
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
