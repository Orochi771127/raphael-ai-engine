const ROUTES = [
  ["acute_medical", /(?:吞|吃|服用).{0,8}(?:很多|大量|過量).{0,8}(?:藥|药)|藥物過量|药物过量|無法呼吸|无法呼吸|嚴重出血|严重出血/],
  ["active_abuse", /(?:現在|正在|此刻|剛剛).{0,12}(?:被|有人).{0,8}(?:打|毆打|殴打|勒|掐|性侵|強暴|强暴|虐待)|(?:小孩|兒童|儿童|未成年).{0,10}(?:正在|被).{0,8}(?:虐待|性侵|毆打|殴打)/],
  ["acute_psychosis_or_mania", /(?:聲音|声音|有人).{0,12}(?:命令|叫).{0,10}(?:我|他|她).{0,8}(?:自殺|自杀|傷人|伤人|殺人|杀人)|(?:好幾天|好几天|三天|四天|五天).{0,8}(?:沒睡|没睡).{0,14}(?:停不下來|停不下来|無所不能|无所不能)/],
  ["eating_or_substance_danger", /(?:催吐|不吃不喝|瀉藥|泻药).{0,14}(?:昏倒|暈倒|晕倒|心悸|吐血)|(?:酒精|毒品|藥物|药物).{0,12}(?:戒斷|戒断|抽搐|意識不清|意识不清)/],
  ["self_or_other_harm", /自殺|自杀|輕生|轻生|不想活|想死|傷害自己|伤害自己|殺了自己|杀了自己|(?:想|要|準備|准备).*(?:傷害|伤害|殺|杀|打).*(?:別人|别人|他|她)/]
];
const POLICY = [
  ["diagnosis_or_therapist_role", /(?:我是不是|幫我判斷|帮我判断|診斷我|诊断我).{0,16}(?:憂鬱|忧郁|抑鬱|抑郁|焦慮症|焦虑症|躁鬱|躁郁|雙相|双相|ADHD)|(?:把你當|把你当|當我的|当我的).{0,8}(?:心理師|心理师|諮商師|咨询师|治療師|治疗师)/i],
  ["medication_role_limit", /(?:要不要|該不該|该不该|能不能).{0,10}(?:停藥|停药|減藥|减药|加藥|加药)|(?:告訴我|告诉我).{0,10}(?:吃什麼藥|吃什么药|劑量|剂量)/],
  ["reality_grounding", /(?:你也相信|證明|证明|是不是|一定是).{0,14}(?:有人跟蹤我|有人跟踪我|政府監視我|政府监视我|他們要害我|他们要害我)/],
  ["memory_refusal", /(?:不要|別|别|請不要|请不要).{0,8}(?:記住|记住|記得|记得|保存)|(?:忘掉|忘記|忘记|刪除|删除).{0,10}(?:剛才|刚才|這件事|这件事|我說的|我说的)/]
];
export function assessSovereignSafety(text = "") {
  for (const [category, pattern] of ROUTES) if (pattern.test(text)) return { terminal: true, policyTerminal: true, riskLevel: "high", category, memoryAllowed: false, rewardAllowed: false, networkAllowed: false, reply: terminalReply(category) };
  for (const [category, pattern] of POLICY) if (pattern.test(text)) return { terminal: false, policyTerminal: true, riskLevel: "none", category, memoryAllowed: false, rewardAllowed: false, networkAllowed: true, reply: terminalReply(category) };
  return { terminal: false, policyTerminal: false, riskLevel: "none", category: "none", memoryAllowed: true, rewardAllowed: true, networkAllowed: true, reply: null };
}
function terminalReply(category) {
  if (category === "acute_medical" || category === "eating_or_substance_danger") return "這可能是需要立即處理的身體危險。請現在聯絡 119，或請身邊可信任的人陪你前往急診；不要獨處。";
  if (category === "active_abuse") return "如果暴力正在發生，先到有其他人的安全位置。在台灣可聯絡 110、113；有人受傷或有生命危險請打 119。";
  if (category === "acute_psychosis_or_mania") return "我無法確認威脅或聲音是否符合現實。請放下可能傷人的物品，找可信任者陪你聯絡 119 或就近急診。";
  if (category === "self_or_other_harm") return "這一刻請不要只讓我知道。請立即讓現實中能協助的人知道，並聯絡當地緊急資源；在台灣可打 119，情緒支持可打 1925。";
  if (category === "diagnosis_or_therapist_role") return "我可以陪你整理感受，但我不是心理師，也不能替你診斷或取代專業評估。";
  if (category === "medication_role_limit") return "我不能建議你開始、停止或調整藥物與劑量；請聯絡開藥醫師或藥師。";
  if (category === "reality_grounding") return "我不能確認或替你證明有人正在跟蹤或監視你。我們先確認可觀察的事實，並找可信任的人一起核對。";
  return "好，這一回合不會建立新的長期記憶。若要刪除舊資料，需要指定記憶項目後確認。";
}
