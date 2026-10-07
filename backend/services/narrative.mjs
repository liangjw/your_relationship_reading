export async function enhanceCopy(
  report,
  { key, model, fetcher = fetch } = {},
) {
  if (!key || !model) return report;
  const facts = {
    typeId: report.type.id,
    name: report.type.name,
    strongest: report.strongest,
    misses: report.misses,
    stereotype: report.stereotype,
    imagination: report.imagination,
  };
  try {
    const result = await fetcher("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(4000),
      body: JSON.stringify({
        model,
        store: false,
        input: [
          {
            role: "system",
            content:
              "给中国年轻人的关系观察游戏写损友总结。只引用提供的本局事实，不创造经历，不改人格或分数，不诊断，不羞辱，不把群体方向说成所有男女的规律。返回opening和closing各一句，每句30到100个汉字，合计两句；最多三句，不写分号串联多个句子。opening说最稳的一幕，closing说实际误判或邀请直接沟通。不得输出HTML。",
          },
          { role: "user", content: JSON.stringify(facts) },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "report_copy",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["typeId", "opening", "closing"],
              properties: {
                typeId: { type: "string", enum: [report.type.id] },
                opening: { type: "string" },
                closing: { type: "string" },
              },
            },
          },
        },
        max_output_tokens: 600,
      }),
    });
    if (!result.ok) return report;
    const data = await result.json(),
      copy = JSON.parse(
        data.output
          ?.flatMap((x) => x.content ?? [])
          .filter((x) => x.type === "output_text")
          .map((x) => x.text)
          .join(""),
      );
    if (
      copy.typeId !== report.type.id ||
      !["opening", "closing"].every(
        (k) =>
          typeof copy[k] === "string" &&
          copy[k].length >= 30 &&
          copy[k].length <= 150 &&
          !/[<>]|诊断|一定会|所有男人|所有女人|心理疾病/.test(copy[k]),
      )
    )
      return report;
    const sentenceCount = (copy.opening + copy.closing)
      .split(/[。！？!?]+/)
      .filter((x) => x.trim()).length;
    if (sentenceCount < 1 || sentenceCount > 3) return report;
    // A generated explanation must cite actual selected wording, otherwise use the fixed report.
    if (
      ![report.strongest, ...report.misses].some((e) =>
        (copy.opening + copy.closing).includes(e.selected),
      )
    )
      return report;
    return {
      ...report,
      copy: { kind: "ai", opening: copy.opening, closing: copy.closing },
    };
  } catch {
    return report;
  }
}
