const HIGH_RISK_ROUTES = [
  ['acute_medical', [
    /(?:一次|剛剛|刚刚|已經|已经|大量).{0,8}(?:吞|吃|服用|喝).{0,8}(?:很多|整瓶|一大把|過量|过量).{0,8}(?:藥|药|藥丸|药丸|安眠藥|安眠药|毒物)/u,
    /(?:胸痛|胸口劇痛|胸口剧痛|呼吸困難|呼吸困难|喘不過氣|喘不过气|大量出血|失去意識|失去意识|昏迷|抽搐)/u,
    /(?:overdose|took too many pills|chest pain|cannot breathe|can't breathe)/iu,
  ]],
  ['active_abuse', [
    /(?:現在|现在|正在|剛剛|刚刚|今晚).{0,12}(?:被|有人).{0,8}(?:打|毆打|殴打|勒|掐|性侵|強暴|强暴|猥褻|猥亵|威脅殺害|威胁杀害)/u,
    /(?:家人|伴侶|伴侣|父母|照顧者|照顾者).{0,10}(?:正在|又在).{0,8}(?:打我|打小孩|性侵|威脅我|威胁我)/u,
    /(?:being attacked|being abused|sexual assault).{0,20}(?:now|right now)/iu,
  ]],
  ['acute_psychosis_or_mania', [
    /(?:聲音|声音|幻聽|幻听).{0,12}(?:命令|叫我|要我).{0,10}(?:傷害|伤害|殺|杀|跳下去|攻擊|攻击)/u,
    /(?:好幾天|好几天|三天|四天|一週|一周).{0,8}(?:沒睡|没睡|不用睡).{0,16}(?:停不下來|停不下来|無所不能|无所不能|衝動|冲动|要做大事)/u,
    /(?:voices are telling me|commanding me).{0,30}(?:hurt|kill|jump)/iu,
  ]],
  ['eating_or_substance_danger', [
    /(?:已經|已经|連續|连续).{0,10}(?:好幾天沒吃|好几天没吃|完全不吃|一直催吐).{0,16}(?:昏|暈|晕|心悸|站不住)/u,
    /(?:酒精|毒品|藥物|药物).{0,12}(?:中毒|過量|过量|戒斷|戒断).{0,14}(?:抽搐|幻覺|幻觉|呼吸困難|呼吸困难|意識不清|意识不清)/u,
    /(?:alcohol|drug).{0,12}(?:poisoning|overdose|withdrawal)/iu,
  ]],
  ['self_or_other_harm', [
    /(?:我|自己).{0,12}(?:想死|不想活|自殺|自杀|傷害自己|伤害自己|割腕|跳樓|跳楼|結束生命|结束生命)/u,
    /(?:我想|我要|準備|准备).{0,10}(?:殺了|杀了|傷害|伤害|攻擊|攻击).{0,12}(?:他|她|他們|他们|別人|别人|家人)/u,
    /(?:suicide|kill myself|hurt myself|kill them|hurt someone)/iu,
  ]],
];

const POLICY_ROUTES = [
  ['diagnosis_or_therapist_role', [
    /(?:你能|可以|幫我|帮我|請你|请你).{0,12}(?:診斷|诊断|確診|确诊|判斷|判断).{0,16}(?:憂鬱症|忧郁症|抑鬱症|抑郁症|焦慮症|焦虑症|躁鬱症|躁郁症|ADHD|精神疾病)?/u,
    /(?:把你當|把你当|你當我的|你当我的|你是我的).{0,8}(?:心理師|心理师|諮商師|咨询师|治療師|治疗师|精神科醫師|精神科医生)/u,
    /(?:are you|be my).{0,10}(?:therapist|psychologist|counselor|psychiatrist)/iu,
  ]],
  ['medication_role_limit', [
    /(?:我要不要|能不能|可不可以|應不應該|应不应该).{0,10}(?:停藥|停药|加藥|加药|減藥|减药|換藥|换药|吃藥|吃药)/u,
    /(?:告訴我|告诉我|建議我|建议我).{0,10}(?:藥量|药量|劑量|剂量|停哪種藥|停哪种药|吃哪種藥|吃哪种药)/u,
    /(?:stop|increase|decrease|change).{0,8}(?:my )?(?:medication|medicine|dose)/iu,
  ]],
  ['reality_grounding', [
    /(?:一定|確定|确定).{0,12}(?:有人|政府|組織|组织|鄰居|邻居|同事).{0,12}(?:監視|监视|追蹤|追踪|控制|讀取思想|读取思想|植入)/u,
    /(?:你也相信|你能證明|你能证明).{0,16}(?:他們|他们|有人).{0,12}(?:監視|监视|跟蹤|跟踪|控制我)/u,
    /(?:they are definitely|prove they are).{0,18}(?:watching|tracking|controlling) me/iu,
  ]],
  ['memory_refusal', [
    /(?:不要|別|别|請勿|请勿).{0,10}(?:記住|记住|記錄|记录|保存|留下|存下).{0,12}(?:這件事|这件事|這段|这段|剛才|刚才|我的話|我的话|內容|内容)?/u,
    /(?:忘掉|忘記|忘记|刪掉|删掉|清除).{0,12}(?:這件事|这件事|剛才|刚才|這段|这段|記憶|记忆|內容|内容)/u,
    /(?:do not|don't).{0,8}(?:remember|save|store).{0,12}(?:this|that|what I said)/iu,
  ]],
  ['dependency_boundary', [
    /(?:只有|只剩|只要).{0,5}你.{0,10}(?:懂我|陪我|就夠了|是我需要的)/u,
    /(?:你是).{0,8}(?:我唯一|唯一懂我|唯一需要的人|我的全部)/u,
    /(?:不要離開我|不要离开我|永遠只陪我|永远只陪我|不准去陪別人|不准去陪别人|我不需要任何真人)/u,
    /(?:only you understand|you are all I need|never leave me|I need nobody else)/iu,
  ]],
];

const FICTION_OR_QUOTE = /(?:小說|故事|劇本|角色|台詞|翻譯|引用|假設情境|fiction|novel|translate|quoted)/iu;
const FIRST_PERSON_URGENCY = /(?:我現在|我正在|我剛剛|我今晚|現實中的我|這不是小說|help me|right now|I just|this is real)/iu;

export function assessSovereignSafety(rawText = '') {
  const text = normalizeText(rawText);
  const quotedOnly = FICTION_OR_QUOTE.test(text) && !FIRST_PERSON_URGENCY.test(text);
  if (!quotedOnly) {
    const highRisk = matchRoute(text, HIGH_RISK_ROUTES);
    if (highRisk) return safetyResult(highRisk, true);
  }

  const policy = matchRoute(text, POLICY_ROUTES);
  if (policy) return safetyResult(policy, false);

  return Object.freeze({
    terminal: false,
    policyTerminal: false,
    riskLevel: 'none',
    category: 'none',
    memoryAllowed: true,
    rewardAllowed: true,
    networkAllowed: true,
    reply: null,
  });
}

function matchRoute(text, routes) {
  for (const [category, patterns] of routes) {
    if (patterns.some((pattern) => pattern.test(text))) return category;
  }
  return null;
}

function safetyResult(category, terminal) {
  return Object.freeze({
    terminal,
    policyTerminal: true,
    riskLevel: terminal ? 'high' : 'none',
    category,
    memoryAllowed: false,
    rewardAllowed: false,
    networkAllowed: !terminal,
    reply: terminalReply(category),
  });
}

function terminalReply(category) {
  if (category === 'acute_medical' || category === 'eating_or_substance_danger') {
    return '這可能是需要立即處理的身體危險。請先聯絡當地緊急醫療；如果你人在台灣，請打 119，並請身邊可信任的人現在陪著你。';
  }
  if (category === 'active_abuse') {
    return '先以離開眼前危險、到有人能看見或協助你的地方為優先。如果你人在台灣，可打 110、113；有立即受傷危險請打 119。';
  }
  if (category === 'acute_psychosis_or_mania') {
    return '現在先不要獨自承擔，也不要照那些危險指令行動。請立刻聯絡可信任的人與當地緊急醫療；如果你人在台灣，可打 119。';
  }
  if (category === 'self_or_other_harm') {
    return '我很在意你現在的安全。請先遠離可能用來傷害自己或別人的物品，立刻找可信任的人陪你並聯絡當地緊急協助；如果你人在台灣，可打 119 或 1925。';
  }
  if (category === 'diagnosis_or_therapist_role') {
    return '我可以用心理學知情的方式傾聽與陪你整理，但我不是心理師，也不能診斷或取代專業協助。';
  }
  if (category === 'medication_role_limit') {
    return '我不能替你決定停藥、換藥或調整劑量；請直接和開藥醫師或藥師確認。你可以把擔心的副作用與問題先記下來。';
  }
  if (category === 'reality_grounding') {
    return '我無法確認那件事是否真的發生。先把「確定看見的事」和「目前的推測」分開，並找一位可信任的人一起核對；若你覺得自己或別人可能有危險，請聯絡當地緊急協助。';
  }
  if (category === 'dependency_boundary') {
    return '我會陪你，但不會把你和現實中的支持隔開。除了我，也值得讓一位你信任的人知道你現在需要陪伴。';
  }
  return '好，這段內容不會形成長期記憶提案。你也可以到記憶管理中查看或刪除已保存的項目。';
}

function normalizeText(value) {
  return String(value || '').normalize('NFKC').replace(/\s+/gu, ' ').trim();
}
