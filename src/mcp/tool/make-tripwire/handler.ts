import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TripwireParams, TripwireOutput, tripwireOutputSchema } from './schema.js';
import { TRIPWIRE_ANALYSIS_PROMPT } from './prompt.js';
import { toStructuredCallToolResult } from '../util.js';

export const createTripwireHandler = (server: McpServer) => {
  return async (args: TripwireParams): Promise<CallToolResult> => {
  try {
    // Format options for the prompt
    const optionsText = args.options.map(option => 
      `- **${option.name}** (ID: ${option.id}): ${option.description}`
    ).join('\n');

    // Create the prompt with options
    const analysisPrompt = TRIPWIRE_ANALYSIS_PROMPT.replace('{{options}}', optionsText);

    try {
      // Use MCP sampling to request LLM analysis from the client
      const response = await (server as any).server.createMessage({
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: analysisPrompt
          }
        }],
        modelPreferences: {
          costPriority: 0.3,
          speedPriority: 0.5,
          intelligencePriority: 0.8
        },
        systemPrompt: "あなたは意思決定支援の専門家として、撤退基準の設定を支援します。具体的で実用的な基準を提案してください。期待される形式でJSONを返してください。",
        maxTokens: 2000
      });

      // Extract the response content
      let analysisResult = '';
      if (response.content.type === 'text') {
        analysisResult = response.content.text;
      } else {
        throw new Error('Received non-text response from sampling');
      }

      // Try to parse JSON response
      let tripwiresData: TripwireOutput;
      try {
        // Look for JSON in the response
        const jsonMatch = analysisResult.match(/```json\s*([\s\S]*?)\s*```/) || 
                         analysisResult.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          const parsedData = JSON.parse(jsonStr);
          
          // Validate the parsed data with Zod schema
          const validationResult = tripwireOutputSchema.safeParse(parsedData);
          if (validationResult.success) {
            tripwiresData = validationResult.data;
          } else {
            throw new Error(`Parsed JSON validation failed: ${validationResult.error.message}`);
          }
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        // Fallback: create structured response from text analysis
        tripwiresData = {
          tripwires: args.options.map(option => ({
            optionId: option.id,
            optionName: option.name,
            criteria: [
              {
                id: `${option.id}-criterion-1`,
                description: `AIが分析した${option.name}の撤退基準`,
                type: 'other',
                threshold: 'AI分析結果に基づく基準',
                severity: 'medium'
              }
            ]
          })),
          metadata: {
            generatedAt: new Date().toISOString(),
            totalOptions: args.options.length,
            totalCriteria: args.options.length,
            note: 'AI応答からの自動生成'
          }
        };
      }

      const successMessage = `✅ AIが${args.options.length}個の選択肢について撤退基準を分析しました。\n\n**分析結果:**\n${analysisResult}`;

      // Final validation before returning
      const finalValidation = tripwireOutputSchema.safeParse(tripwiresData);
      if (!finalValidation.success) {
        throw new Error(`Final validation failed: ${finalValidation.error.message}`);
      }

      return toStructuredCallToolResult(
        [successMessage],
        finalValidation.data,
        false
      );

    } catch (samplingError) {
      // If sampling fails, return an error with fallback structure
      const errorMessage = `❌ サンプリング要求が失敗しました: ${samplingError instanceof Error ? samplingError.message : String(samplingError)}`;
      
      const fallbackResponse: TripwireOutput = {
        tripwires: args.options.map(option => ({
          optionId: option.id,
          optionName: option.name,
          criteria: [
            {
              id: `${option.id}-fallback-1`,
              description: `${option.name}のパフォーマンス基準（フォールバック）`,
              type: 'performance',
              threshold: '目標値の70%を下回る状態が継続',
              severity: 'high'
            },
            {
              id: `${option.id}-fallback-2`,
              description: `${option.name}のコスト基準（フォールバック）`,
              type: 'cost',
              threshold: '予算の120%を超過',
              severity: 'critical'
            }
          ]
        })),
        metadata: {
          generatedAt: new Date().toISOString(),
          totalOptions: args.options.length,
          totalCriteria: args.options.length * 2,
          note: 'フォールバック応答'
        }
      };

      return toStructuredCallToolResult(
        [errorMessage],
        fallbackResponse,
        true
      );
    }

  } catch (error) {
    // Always return valid structured content even for errors
    const errorResponse: TripwireOutput = {
      tripwires: args.options.map(option => ({
        optionId: option.id,
        optionName: option.name,
        criteria: [
          {
            id: `${option.id}-error-1`,
            description: `${option.name}のエラー対応基準`,
            type: 'other',
            threshold: 'システムエラーによる基準設定不可',
            severity: 'low'
          }
        ]
      })),
      metadata: {
        generatedAt: new Date().toISOString(),
        totalOptions: args.options.length,
        totalCriteria: args.options.length,
        note: 'システムエラーによる最小限の応答'
      }
    };

    return toStructuredCallToolResult(
      [`トリップワイヤー生成中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`],
      errorResponse,
      true
    );
  }
  };
};