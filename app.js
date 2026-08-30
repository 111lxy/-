(function () {
  "use strict";

  const KB = window.KB;
  const WL = window.KB_WHITELIST;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // ---------- 状态 ----------
  const state = {
    profile: loadProfile(),
    activePanel: "chat",
    lastMatch: null,
    customComps: loadCustomComps(),
    llm: loadLLM()
  };

  const STORAGE_KEYS = {
    profile: "gszt_profile_v1",
    custom: "gszt_custom_comps_v1",
    llm: "gszt_llm_v1"
  };

  const LLM_PROVIDERS = {
    openrouter: { base: "https://openrouter.ai/api/v1", model: "deepseek/deepseek-chat-v3.2" },
    deepseek: { base: "https://api.deepseek.com/v1", model: "deepseek-chat" },
    zhipu: { base: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4-flash" },
    moonshot: { base: "https://api.moonshot.cn/v1", model: "moonshot-v1-8k" },
    custom: { base: "", model: "" }
  };

  function loadProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.profile);
      return raw ? JSON.parse(raw) : { grade: "", major: "", interests: [], skills: "", teamSize: 1 };
    } catch (e) {
      return { grade: "", major: "", interests: [], skills: "", teamSize: 1 };
    }
  }
  function saveProfile() {
    try { localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(state.profile)); } catch (e) {}
  }
  function loadCustomComps() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.custom);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
  function saveCustomComps() {
    try { localStorage.setItem(STORAGE_KEYS.custom, JSON.stringify(state.customComps)); } catch (e) {}
  }
  function loadLLM() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.llm);
      return raw ? JSON.parse(raw) : { provider: "openrouter", baseUrl: "", apiKey: "", model: "" };
    } catch (e) {
      return { provider: "openrouter", baseUrl: "", apiKey: "", model: "" };
    }
  }
  function saveLLM() {
    try { localStorage.setItem(STORAGE_KEYS.llm, JSON.stringify(state.llm)); } catch (e) {}
  }
  function isLLMReady() {
    return !!(state.llm.apiKey && state.llm.baseUrl && state.llm.model);
  }

  const allComps = () => KB.competitions.concat(state.customComps);

  // ---------- 工具 ----------
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function daysUntil(dateStr) {
    const now = new Date();
    const target = new Date(dateStr + "T23:59:59");
    const diff = target - now;
    return Math.ceil(diff / 86400000);
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  // ---------- 图标 ----------
  const ICONS = {
    bot: '<svg viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 4v4M9 12v1M15 12v1M8 20h8"/></svg>',
    video: '<svg viewBox="0 0 24 24"><path d="M4 6h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><path d="m17 10 5-3v10l-5-3"/></svg>',
    film: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16M16 4v16M3 9h5M3 15h5M16 9h5M16 15h5"/></svg>',
    image: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-4-4-9 8"/></svg>',
    pen: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    music: '<svg viewBox="0 0 24 24"><path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/></svg>',
    clipboard: '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 9h6M9 13h6M9 17h4"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M4 4a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2Z"/><path d="M4 20a2 2 0 0 1 2-2h13"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M4 12.5 9.5 18 20 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    list: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 20h16"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/></svg>'
  };
  function icon(name) {
    return ICONS[name] || ICONS.sparkle;
  }

  // ---------- 渲染消息 ----------
  const chatLog = $("#chatLog");

  function pushMessage(html, role) {
    const wrap = document.createElement("div");
    wrap.className = "msg " + (role === "user" ? "msg-user" : "msg-agent");
    if (role === "agent") {
      wrap.innerHTML =
        '<div class="avatar avatar-agent">' + icon("bot") + "</div>" +
        '<div class="bubble">' + html + "</div>";
    } else {
      wrap.innerHTML = '<div class="bubble">' + html + "</div>";
    }
    chatLog.appendChild(wrap);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function botText(text) {
    return '<div class="md">' + esc(text).replace(/\n/g, "<br>") + "</div>";
  }

  function typing(delay) {
    const el = document.createElement("div");
    el.className = "msg msg-agent";
    el.id = "typing";
    el.innerHTML =
      '<div class="avatar avatar-agent">' + icon("bot") + "</div>" +
      '<div class="bubble typing"><span></span><span></span><span></span></div>';
    chatLog.appendChild(el);
    chatLog.scrollTop = chatLog.scrollHeight;
    return new Promise((res) => setTimeout(() => { el.remove(); res(); }, delay || 350));
  }

  // ---------- 意图识别 ----------
  const GREET = /你好|您好|嗨|哈喽|hello|hi\b|在吗|你是谁|介绍一下|能做什么|有什么功能|开始|菜单/i;
  const QUERY = /有什么比赛|哪些比赛|最近.*(比赛|赛事|活动)|比赛.*(查询|有哪些|列表)|查.*比赛|赛事|竞赛|活动/;
  const MATCH = /我适合|适合.*(哪个|什么)|推荐|匹配|哪个赛道|选哪个|报什么|怎么选|适合什么赛道/;
  const ELIG = /能不能|可以参加|报名条件|有什么条件|资格|符不符合|够不够|能不能报|可以吗/;
  const MATERIAL = /准备什么|材料|清单|要交什么|提交什么|带什么|需要什么材料|要准备/;
  const PLAN = /计划|方案|步骤|流程|怎么做|怎么报名|参赛计划|行动/;
  const COUNTDOWN = /截止|还有几天|多少天|时间|什么时候|deadline|倒计时/;
  const NAME = /命名|起名|名字|标题|取名/;
  const PPT = /ppt|幻灯片|结构|框架|怎么写|演示|应用说明/;
  const TEST = /测试|案例|测试数据|测试账号/;
  const HELP = /帮我|作品|创意|点子|灵感|思路/;
  const TRACK_NAMES = ["数智新技艺", "光影趣青春", "影像创意汇", "网图新视界", "网语青年说", "校园好声音", "网创梦工厂"];
  const CATEGORY_KEYS = ["智能体", "AIGC", "虚拟现实", "VR", "AR", "自主研发", "创新创意", "微视频", "微课", "微电影", "动漫", "公益广告", "漫画", "摄影", "平面广告", "网络文章", "网络文学", "网络评论", "音频", "歌曲", "推文", "H5", "长图", "表情包", "文创"]; 

  function detectTrack(text) {
    for (const name of TRACK_NAMES) {
      if (text.includes(name)) return name;
    }
    const map = {
      "智能体": "数智新技艺", "AIGC": "数智新技艺", "AI": "数智新技艺", "人工智能": "数智新技艺",
      "虚拟现实": "数智新技艺", "VR": "数智新技艺", "AR": "数智新技艺", "自主研发": "数智新技艺",
      "创新创意": "数智新技艺", "元宇宙": "数智新技艺",
      "微视频": "光影趣青春", "短视频": "光影趣青春", "微课程": "光影趣青春", "微课": "光影趣青春",
      "微电影": "影像创意汇", "动漫": "影像创意汇", "动画": "影像创意汇",
      "漫画": "网图新视界", "摄影": "网图新视界", "平面广告": "网图新视界",
      "网络文章": "网语青年说", "网络文学": "网语青年说", "网络评论": "网语青年说",
      "音频": "校园好声音", "歌曲": "校园好声音", "诵读": "校园好声音",
      "推文": "网创梦工厂", "H5": "网创梦工厂", "长图": "网创梦工厂", "表情包": "网创梦工厂", "文创": "网创梦工厂"
    };
    for (const k in map) {
      if (text.toUpperCase().includes(k.toUpperCase())) return map[k];
    }
    return null;
  }

  function detectIntent(text) {
    const t = text.trim();
    if (!t) return { type: "empty" };
    if (GREET.test(t) && t.length < 12) return { type: "greet" };

    // 权威竞赛库（白名单）优先识别
    const wlComp = detectWLCompetition(t);
    const wlKeyword = /白名单|权威竞赛|权威榜单|国家级竞赛|竞赛排行榜|全国大学生竞赛|学科竞赛排行榜/.test(t);
    if (wlComp || wlKeyword) {
      if (MATCH.test(t) || /适合|推荐|报什么|参加什么|能参加/.test(t)) return { type: "wlmatch", comp: wlComp };
      if (wlComp) return { type: "wldetail", comp: wlComp };
      return { type: "wlquery" };
    }

    if (NAME.test(t)) return { type: "naming" };
    if (PPT.test(t)) return { type: "ppt" };
    if (TEST.test(t)) return { type: "test" };
    if (COUNTDOWN.test(t)) return { type: "countdown" };
    if (MATCH.test(t)) return { type: "match" };
    if (ELIG.test(t)) return { type: "eligibility" };
    if (MATERIAL.test(t)) return { type: "materials" };
    if (PLAN.test(t)) return { type: "plan" };
    if (QUERY.test(t)) return { type: "query" };
    if (HELP.test(t)) return { type: "help" };
    const track = detectTrack(t);
    if (track) return { type: "track", track };
    return { type: "fallback" };
  }

  function detectWLCompetition(text) {
    const q = text.replace(/是什么|怎么|适合|参加|报名|报什么|有哪些|哪些|什么|比赛|竞赛|大赛|时候|时间|帮我|推荐|介绍|一下|吗|呢|的/g, "").trim();
    let best = null, bestLen = 0;
    for (const c of WL.competitions) {
      const triggers = [c.shortName.split(/[(（]/)[0], c.name.replace(/[“”"'（）]/g, ""), coreTrigger(c.name)];
      for (const tr of triggers) {
        if (!tr || tr.length < 3) continue;
        if (text.includes(tr) || (q.length >= 2 && tr.includes(q))) {
          if (tr.length > bestLen) { best = c; bestLen = tr.length; }
        }
      }
    }
    return best;
  }

  function coreTrigger(name) {
    let t = name.replace(/[“”"‘’'（）()《》·]/g, "");
    t = t.replace(/^(全国|中国|国际|全球校园|两岸|世界)/, "");
    t = t.replace(/(大学生|高校|职业院校|本科院校|高等院校)/, "");
    t = t.replace(/(大赛|竞赛|挑战赛|比赛|论坛|年会展示|排行榜)$/, "");
    return t;
  }

  function extractMajor(text) {
    const m = text.match(/([一-龥]{2,8})(专业|系|学院)/);
    return m ? m[1] : "";
  }

  function extractGrade(text) {
    const m = text.match(/(大一|大二|大三|大四|研究生|硕士|博士)/);
    return m ? m[1] : "";
  }

  // ---------- 赛道匹配 ----------
  function scoreTrack(track, profile) {
    let score = 0;
    const reasons = [];
    const all = [profile.major || "", profile.skills || ""].join(" ") + " " + (profile.interests || []).join(" ");
    const l = all.toLowerCase();
    for (const kw of track.keywords) {
      if (l.includes(kw.toLowerCase())) {
        score += 3;
        reasons.push("关键词「" + kw + "」匹配");
      }
    }
    for (const mj of track.majors) {
      if (l.includes(mj)) {
        score += 5;
        reasons.push("专业「" + mj + "」契合");
      }
    }
    for (const it of track.interests) {
      if ((profile.interests || []).includes(it)) {
        score += 4;
        reasons.push("兴趣「" + it + "」契合");
      }
    }
    return { score, reasons };
  }

  function matchTracks(profile) {
    const comp = KB.competitions.find((c) => c.id === "2026-net-culture");
    const scored = comp.tracks.map((t) => {
      const r = scoreTrack(t, profile);
      return { track: t, ...r };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored;
  }

  // ---------- 响应构建 ----------
  function buildGreeting() {
    const days = daysUntil(KB.defaultDeadline);
    return (
      '<div class="greet-title">你好，我是桂工赛智通 🤖</div>' +
      '<div class="md">我专门帮桂林理工大学的同学<strong>查比赛、选赛道、判断资格、准备材料、做参赛方案</strong>。知识库里现在有 <strong>2 场校内赛事</strong>（网络文化节 7 赛道 + 教师 5 类），以及 <strong>84 项全国大学生权威竞赛</strong>（白名单）。</div>' +
      '<div class="kv-row"><span class="kv-k">最近截止</span><span class="kv-v">' + esc(KB.competitions[0].name) + "</span></div>" +
      '<div class="kv-row"><span class="kv-k">倒计时</span><span class="kv-v warn">' + days + " 天（" + KB.defaultDeadline + "）</span></div>" +
      '<div class="md dim">你可以直接问我，比如下面这些👇</div>'
    );
  }

  function buildQuery() {
    const comps = allComps();
    const items = comps.map((c) => {
      const days = daysUntil(c.deadline);
      return (
        '<div class="comp-card" data-id="' + esc(c.id) + '">' +
          '<div class="comp-head"><span class="comp-ico">' + icon(c.id === "2026-net-culture" ? "target" : "book") + "</span>" +
            '<div><div class="comp-name">' + esc(c.name) + "</div>" +
            '<div class="comp-meta">' + esc(c.audience) + "</div></div></div>" +
          '<div class="comp-foot"><span class="chip chip-deadline">⏰ ' + (days >= 0 ? days + " 天截止" : "已截止") + "</span>" +
          '<span class="chip">' + esc((c.tracks || []).length) + " 个赛道/类别</span></div>" +
        "</div>"
      );
    }).join("");
    return '<div class="md"><strong>校内赛事（' + comps.length + " 场）：</strong></div>" +
      '<div class="comp-list">' + items + "</div>" +
      '<div class="quick-actions">' +
        '<button class="chip-chip" data-say="白名单竞赛有哪些">📚 查看 84 项全国权威竞赛</button>' +
        '<button class="chip-chip" data-say="我适合参加什么白名单竞赛">🎯 匹配白名单竞赛</button>' +
      "</div>";
  }

  function buildTrackDetail(name) {
    const comp = KB.competitions.find((c) => c.id === "2026-net-culture");
    const track = comp.tracks.find((t) => t.name === name);
    if (!track) return botText("没有找到「" + name + "」这个赛道。");
    const cats = track.categories.map((c) =>
      '<div class="cat"><div class="cat-name">' + esc(c.name) + "</div><div class='md dim'>" + esc(c.detail) + "</div></div>"
    ).join("");
    return (
      '<div class="track-head"><span class="comp-ico">' + icon(track.icon) + "</span>" +
        '<div><div class="comp-name">' + esc(track.name) + "</div>" +
        '<div class="comp-meta">' + esc(track.summary) + "</div></div></div>" +
      '<div class="facts">' +
        factRow("作者", track.authorLimit) +
        factRow("指导", track.instructorLimit) +
        factRow("形式", track.format) +
        factRow("推荐量", track.recommendCount) +
      "</div>" +
      '<div class="section-title">作品类别</div><div class="cat-list">' + cats + "</div>" +
      '<div class="section-title">适合人群</div><div class="md">' + esc(track.advantage) + "</div>"
    );
  }

  function factRow(k, v) {
    return '<div class="fact"><span class="fact-k">' + esc(k) + "</span><span class='fact-v'>" + esc(v) + "</span></div>";
  }

  function buildMatch() {
    const p = state.profile;
    const filled = p.major || (p.interests || []).length || p.skills;
    if (!filled) {
      return (
        '<div class="md">我可以根据你的<strong>年级、专业、兴趣和技能</strong>帮你匹配最合适的赛道。你还没有填写画像，可以：</div>' +
        '<div class="md">1️⃣ 直接告诉我，例如：<span class="inline-cmd">“我是计算机专业大二，会编程和做PPT，适合报哪个？”</span><br>2️⃣ 或点左侧「我的画像」快速填写。</div>'
      );
    }
    const scored = matchTracks(p);
    const top = scored[0];
    const rows = scored.slice(0, 3).map((s, i) =>
      '<div class="match-row ' + (i === 0 ? "top" : "") + '">' +
        '<div class="match-rank">' + (i + 1) + "</div>" +
        '<div class="match-body"><div class="match-name">' + esc(s.track.name) + " <span class='match-score'>匹配度 " + Math.min(98, 58 + s.score * 4) + "%</span></div>" +
        '<div class="md dim">' + esc(s.track.summary) + "</div></div></div>"
    ).join("");
    state.lastMatch = top.track;
    return (
      '<div class="md">根据你的画像，我为你匹配如下（结合了专业、兴趣和技能关键词）：</div>' +
      '<div class="match-list">' + rows + "</div>" +
      '<div class="md"><strong>最推荐：' + esc(top.track.name) + "</strong>。" + esc(top.track.advantage) + "</div>" +
      '<div class="quick-actions">' +
        '<button class="chip-chip" data-say="我想报' + esc(top.track.name) + '，需要准备什么材料">📋 看材料清单</button>' +
        '<button class="chip-chip" data-say="帮我做' + esc(top.track.name) + '的参赛计划">🗓 生成参赛计划</button>' +
      "</div>"
    );
  }

  function buildEligibility() {
    const comp = KB.competitions[0];
    const grade = state.profile.grade || "在读";
    const isStudent = !/教师|辅导员|班主任|党政|老师/.test(state.profile.major || "");
    let verdict = "可以参加";
    let reason = "你属于「全日制在校学生」范围，符合大学生网络文化节的对象要求。";
    if (state.profile.grade && /研究生|硕士|博士/.test(state.profile.grade)) {
      reason += "研究生同样属于全日制在校学生，可参加。";
    }
    return (
      '<div class="elig"><div class="elig-ok">' + icon("check") + "</div>" +
        '<div><div class="elig-title">' + verdict + "</div><div class='md dim'>" + reason + "</div></div></div>" +
      '<div class="facts">' +
        factRow("活动对象", comp.audience) +
        factRow("截止时间", comp.deadline) +
        factRow("发表范围", comp.publishRange) +
      "</div>" +
      '<div class="md"><strong>三条硬性要求：</strong><br>① 作品须为 2025-09-15 至 2026-09-07 期间在网络上发表；<br>② 一个作品只能报一个类别，不能重复报送；<br>③ 作品须原创、无版权纠纷。</div>'
    );
  }

  function buildMaterials(trackName) {
    const comp = KB.competitions[0];
    let track = null;
    if (trackName) track = comp.tracks.find((t) => t.name === trackName);
    const common = [
      "作品成品（按赛道格式要求命名并导出）",
      "填写完整的《作品征集汇总表》（加盖学院公章）",
      "汇总表电子档原件 + 盖章扫描件",
      "作品网络链接、当前浏览量截图（供遴选参考）"
    ];
    const specific = track ? trackSpecificMaterials(track) : [];
    const items = specific.concat(common);
    const lis = items.map((it) => '<li>' + esc(it) + "</li>").join("");
    return (
      '<div class="md">' + (track ? "报名「" + esc(track.name) + "」需要准备：</div>" : "报名网络文化节，通用材料清单如下：</div>") +
      '<ul class="checklist">' + lis + "</ul>" +
      '<div class="facts">' +
        factRow("电子报送", comp.submit.email) +
        factRow("纸质报送", comp.submit.paper) +
        factRow("联系人", comp.submit.contact + " · " + comp.submit.phone) +
      "</div>" +
      '<div class="md dim">电子材料命名：<span class="inline-cmd">所在单位+2026年网络文化节</span></div>'
    );
  }

  function trackSpecificMaterials(track) {
    const m = {
      "数智新技艺": ["应用说明 PPT（含应用场景、应用情况、功能特色、测试数据与预期结果、应用入口链接及测试账号）", "如有源代码可一并提交"],
      "光影趣青春": ["MP4 视频文件（≥1920×1080，配字幕）", "系列作品需按 3～10 个 / 微课 ≤5 节整理"],
      "影像创意汇": ["AVI/MOV/MP4 原始作品（≥1920×1080，≤10 分钟）"],
      "网图新视界": ["JPEG 作品（漫画另附 TIFF，摄影保留 EXIF，平面广告 ≤10M）"],
      "网语青年说": ["文章正文（≤5000 字，可配图表）"],
      "校园好声音": ["MP3 音频（≤5 分钟，≤10M，名称 ≤25 字）"],
      "网创梦工厂": ["推文/H5 网络链接，或长图/表情包/文创 JPEG/GIF（<10MB）"]
    };
    return m[track.name] || [];
  }

  function buildPlan(trackName) {
    const comp = KB.competitions[0];
    const track = trackName ? comp.tracks.find((t) => t.name === trackName) : (state.lastMatch || comp.tracks.find((t) => t.id === "shuzhi"));
    const days = daysUntil(comp.deadline);
    const steps = [
      { d: "现在", t: "确定赛道与选题", s: "选定「" + (track ? track.name : "目标赛道") + "」，明确作品类型、创意方向，组好团队（" + (track ? track.authorLimit : "按赛道限制") + "）。" },
      { d: "第 1-2 天", t: "产出作品初稿", s: "按格式要求完成第一版作品；AI 类先把智能体和 PPT 框架搭起来。" },
      { d: "第 3-4 天", t: "打磨与测试", s: "优化内容、补齐字幕/画质/测试数据，找 2-3 位同学试用并记录反馈。" },
      { d: "第 5 天", t: "整理报送材料", s: "填汇总表、盖学院公章，准备好电子档原件 + 扫描件，核对作品信息与汇总表一致。" },
      { d: "截止前 1 天", t: "发送与确认", s: "发送至 " + comp.submit.email + "，纸质材料交至 " + comp.submit.paper + "，并确认收到。" }
    ];
    const html = steps.map((s, i) =>
      '<div class="step"><div class="step-dot"></div><div class="step-body">' +
        '<div class="step-top"><span class="step-day">' + esc(s.d) + "</span><span class='step-title'>" + esc(s.t) + "</span></div>" +
        '<div class="md dim">' + esc(s.s) + "</div></div></div>"
    ).join("");
    return (
      '<div class="md">距离截止还有 <strong class="warn">' + days + " 天</strong>，给你一份倒排计划（以「" + (track ? track.name : "目标赛道") + "」为例）：</div>" +
      '<div class="timeline">' + html + "</div>"
    );
  }

  function buildNaming() {
    const base = "桂工赛智通";
    const names = [
      "桂工赛智通——让每一场比赛都找到最适合你的打开方式",
      "「桂工赛智通」面向大学生竞赛服务的智能体",
      "数智赋能·赛事导航——桂工赛智通智能体"
    ];
    return (
      '<div class="md"><strong>作品命名建议：</strong>竞赛要求「名称 25 字以内」，这里给你 3 个方向：</div>' +
      '<div class="name-list">' + names.map((n) => '<div class="name-item">' + esc(n) + "</div>").join("") + "</div>" +
      '<div class="md dim">命名公式：<span class="inline-cmd">场景词 + 功能词 + 品牌名</span>。推荐第 1 个：既点明产品，又带一句传播感强的副标题。</div>'
    );
  }

  function buildPpt() {
    const sections = [
      "一、应用场景：大学生找比赛难、信息分散、匹配不精准的痛点",
      "二、应用情况介绍：知识库来源（校发通知）、使用对象（在校学生）",
      "三、功能及特色：比赛查询 / 赛道匹配 / 资格判断 / 材料清单 / 参赛助手",
      "四、测试数据与预期结果：匹配准确率、查询响应、用户反馈",
      "五、应用入口链接及测试账号信息",
      "六、未来规划：扩展至奖学金、就业实习等校园事务"
    ];
    return (
      '<div class="md">按「数智新技艺 · 智能体AIGC应用」的提交要求，PPT 建议按这个结构做：</div>' +
      '<ol class="ppt-list">' + sections.map((s) => "<li>" + esc(s) + "</li>").join("") + "</ol>" +
      '<div class="md dim">要求里明确要包含：应用场景、应用情况介绍、功能及特色、测试数据和预期结果、应用入口链接及测试账号信息——这 5 项一条都不能少。</div>'
    );
  }

  function buildTest() {
    const cases = [
      { q: "“我是计算机专业大二，会做PPT，适合报哪个？”", expect: "应推荐「数智新技艺」，并给出材料清单与计划" },
      { q: "“最近有什么比赛？”", expect: "列出网络文化节 + 网络教育优秀作品大赛，显示截止倒计时" },
      { q: "“我不是在校学生，能参加吗？”", expect: "明确判断不满足对象要求，并指向教师大赛" },
      { q: "“报数智新技艺要交什么？”", expect: "给出 PPT 应用说明 + 汇总表 + 电子/纸质报送清单" }
    ];
    return (
      '<div class="md"><strong>建议设计 4 组测试案例</strong>（正好对应 4 个核心功能），用于演示和 PPT 的“测试数据”部分：</div>' +
      '<div class="test-list">' + cases.map((c) =>
        '<div class="test-item"><div class="test-q">' + esc(c.q) + "</div><div class='test-e'>预期：<span class='test-ok'>" + esc(c.expect) + "</span></div></div>"
      ).join("") + "</div>" +
      '<div class="md dim">测试账号信息：可在 PPT 中写明本智能体的在线入口链接，并提供一个演示账号（如 guest / 123456）供评委体验。</div>'
    );
  }

  function buildFallback() {
    return (
      '<div class="md">这个我还没能准确理解 😅。你可以试试这样问：</div>' +
      '<div class="suggest">' +
        '<span class="inline-cmd">最近有什么比赛</span>' +
        '<span class="inline-cmd">我适合报哪个赛道</span>' +
        '<span class="inline-cmd">数智新技艺需要准备什么</span>' +
        '<span class="inline-cmd">帮我做参赛计划</span>' +
      "</div>"
    );
  }

  // ---------- 处理消息 ----------
  function handleInput(text) {
    if (!text.trim()) return;
    pushMessage(esc(text).replace(/\n/g, "<br>"), "user");
    // 先抽取画像，再生成回答，保证“我是XX专业”这类话第一次就能命中
    const mj = extractMajor(text);
    if (mj && !state.profile.major) { state.profile.major = mj; saveProfile(); }
    const gr = extractGrade(text);
    if (gr && !state.profile.grade) { state.profile.grade = gr; saveProfile(); }
    if (mj || gr) syncProfileForm();

    const intent = detectIntent(text);
    const trackName = detectTrack(text);

    // 生成类意图走真实大模型（未配置则回落到规则回答）
    const useLLM = isLLMReady() && (intent.type === "help" || intent.type === "fallback");
    if (useLLM) {
      typing(600).then(async () => {
        try {
          const reply = await callLLM(text);
          pushMessage('<div class="md">' + esc(reply).replace(/\n/g, "<br>") + "</div>", "agent");
        } catch (err) {
          pushMessage('<div class="md"><strong>AI 生成失败</strong></div><div class="md dim">' + esc(err.message || err) + "</div>", "agent");
        }
        renderSuggestions(intent);
      });
      return;
    }

    let html = "";
    switch (intent.type) {
      case "greet": html = buildGreeting(); break;
      case "query": html = buildQuery(); break;
      case "match": html = buildMatch(); break;
      case "eligibility": html = buildEligibility(); break;
      case "materials": html = buildMaterials(trackName); break;
      case "plan": html = buildPlan(trackName); break;
      case "countdown": html = buildCountdown(); break;
      case "naming": html = buildNaming(); break;
      case "ppt": html = buildPpt(); break;
      case "test": html = buildTest(); break;
      case "help": html = buildHelp(); break;
      case "track": html = buildTrackDetail(trackName || intent.track); break;
      case "wlquery": html = buildWLQuery(); break;
      case "wldetail": html = buildWLDetail(intent.comp); break;
      case "wlmatch": html = buildWLMatch(intent.comp || null); break;
      default: html = buildFallback();
    }
    typing().then(() => pushMessage(html, "agent"));
    renderSuggestions(intent);
  }

  function buildCountdown() {
    const rows = allComps().map((c) => {
      const d = daysUntil(c.deadline);
      return factRow(c.shortName, d >= 0 ? d + " 天（" + c.deadline + "）" : "已截止");
    }).join("");
    return '<div class="md">当前赛事截止倒计时：</div><div class="facts">' + rows + "</div>";
  }

  function buildHelp() {
    return (
      '<div class="md">我可以当你的<strong>参赛参谋</strong>，几个高频用法：</div>' +
      '<div class="help-grid">' +
        helpItem("🔍 比赛查询", "“最近有什么比赛”") +
        helpItem("🎯 赛道匹配", "“我是XX专业，适合报哪个”") +
        helpItem("✅ 资格判断", "“我能不能参加”") +
        helpItem("📋 材料清单", "“数智新技艺要准备什么”") +
        helpItem("🗓 参赛计划", "“帮我做参赛计划”") +
        helpItem("🤖 作品思路", "“帮我想作品创意 / 写PPT结构”") +
        helpItem("📚 白名单竞赛", "“白名单竞赛有哪些 / 数学建模是什么”") +
      "</div>"
    );
  }

  function helpItem(t, d) {
    return '<div class="help-item"><div class="help-t">' + t + "</div><div class='md dim'>" + d + "</div></div>";
  }

  // ---------- 权威竞赛库（白名单）----------
  function scoreWL(comp, profile) {
    let score = 0;
    const l = ((profile.major || "") + " " + (profile.skills || "") + " " + (profile.interests || []).join(" ")).toLowerCase();
    for (const kw of comp.keywords || []) if (kw && l.includes(kw.toLowerCase())) score += 3;
    for (const mj of comp.majors || []) if (mj && l.includes(mj)) score += 5;
    for (const it of comp.interests || []) if ((profile.interests || []).includes(it)) score += 4;
    return score;
  }

  function wlLink(comp) {
    if (!comp.url) return "";
    if (/^https?:\/\//i.test(comp.url)) {
      return '<a class="wl-url" href="' + esc(comp.url) + '" target="_blank" rel="noopener">官网入口 ↗</a>';
    }
    return '<span class="wl-note">' + esc(comp.url) + "</span>";
  }

  function buildWLQuery() {
    const byCat = {};
    for (const c of WL.competitions) {
      (byCat[c.category] = byCat[c.category] || []).push(c);
    }
    const order = WL.categories.filter((c) => byCat[c]);
    const secs = order.map((cat) => {
      const rows = byCat[cat].map((c) =>
        '<div class="wl-row"><span class="wl-name">' + esc(c.name) + "</span>" + wlLink(c) + "</div>"
      ).join("");
      return '<div class="section-title">' + esc(cat) + "（" + byCat[cat].length + "）</div><div class='wl-list'>" + rows + "</div>";
    }).join("");
    return (
      '<div class="md"><strong>已收录 ' + WL.competitions.length + " 项全国大学生权威竞赛</strong>（依据 2025 年教育部认可目录）。点「官网入口」可看官方信息，或直接问我某一场，比如：</div>" +
      '<div class="inline-cmd">数学建模竞赛是什么</div>' +
      '<div class="wl-scroll">' + secs + "</div>" +
      '<div class="md dim">具体报名时间以当年官方通知为准。</div>'
    );
  }

  function buildWLMatch(specificComp) {
    const p = state.profile;
    const filled = p.major || (p.interests || []).length || p.skills;
    if (specificComp) {
      const s = scoreWL(specificComp, p);
      return (
        buildWLDetail(specificComp) +
        '<div class="md" style="margin-top:10px">结合你的画像，匹配度 ' + (s > 0 ? "较高" : "一般") + "。想更精准的话，先到左侧「我的画像」填专业和兴趣。</div>"
      );
    }
    if (!filled) {
      return '<div class="md">想匹配白名单竞赛，先告诉我你的<strong>专业、兴趣或技能</strong>。比如：<span class="inline-cmd">“我是计算机专业，会编程，适合参加什么白名单竞赛”</span></div>';
    }
    const scored = WL.competitions.map((c) => ({ c, s: scoreWL(c, p) })).sort((a, b) => b.s - a.s);
    const top = scored.slice(0, 5).filter((x) => x.s > 0);
    if (!top.length) {
      return '<div class="md">我还没从你的画像里匹配到很契合的竞赛。你可以补充专业或技能，例如 <span class="inline-cmd">“我是数学专业，会MATLAB”</span>。</div>';
    }
    const rows = top.map((x, i) =>
      '<div class="match-row ' + (i === 0 ? "top" : "") + '">' +
        '<div class="match-rank">' + (i + 1) + "</div>" +
        '<div class="match-body"><div class="match-name">' + esc(x.c.name) + " <span class='match-score'>匹配度 " + Math.min(98, 58 + x.s * 4) + "%</span></div>" +
        '<div class="md dim">' + esc(x.c.desc) + "</div>" + wlLink(x.c) + "</div></div>"
    ).join("");
    return (
      '<div class="md">根据你的画像，为你推荐这些全国性竞赛：</div>' +
      '<div class="match-list">' + rows + "</div>" +
      '<div class="md dim">点「官网入口」查看官方通知，具体时间以当年通知为准。</div>'
    );
  }

  function buildWLDetail(comp) {
    return (
      '<div class="track-head"><span class="comp-ico">' + icon("target") + "</span>" +
        '<div><div class="comp-name">' + esc(comp.name) + "</div>" +
        '<div class="comp-meta">' + esc(comp.category) + " · " + esc(comp.organizer) + "</div></div></div>" +
      '<div class="facts">' +
        factRow("类别", comp.category) +
        factRow("主办", comp.organizer) +
        factRow("对象", comp.audience || "本科生、研究生") +
      "</div>" +
      '<div class="md">' + esc(comp.desc) + "</div>" +
      '<div style="margin-top:8px">' + wlLink(comp) + "</div>" +
      '<div class="md dim">具体报名时间、赛道以当年官方通知为准。</div>'
    );
  }

  // ---------- 建议 chips ----------
  function renderSuggestions(intent) {
    const set = new Set([
      "最近有什么比赛",
      "我适合报哪个赛道",
      "我能不能参加",
      "数智新技艺需要准备什么",
      "帮我做参赛计划",
      "白名单竞赛有哪些",
      "我适合参加什么白名单竞赛"
    ]);
    const el = $("#suggestions");
    el.innerHTML = Array.from(set).map((s) => '<button class="chip-chip" data-say="' + esc(s) + '">' + esc(s) + "</button>").join("");
  }

  // ---------- 画像表单 ----------
  function syncProfileForm() {
    $("#pf-grade").value = state.profile.grade || "";
    $("#pf-major").value = state.profile.major || "";
    $("#pf-skills").value = state.profile.skills || "";
    $("#pf-team").value = state.profile.teamSize || 1;
    $$(".int-chip").forEach((el) => {
      el.classList.toggle("active", (state.profile.interests || []).includes(el.dataset.v));
    });
  }

  function bindProfile() {
    $$(".int-chip").forEach((el) => {
      el.addEventListener("click", () => {
        const v = el.dataset.v;
        const arr = state.profile.interests || [];
        const i = arr.indexOf(v);
        if (i >= 0) arr.splice(i, 1); else arr.push(v);
        state.profile.interests = arr;
        el.classList.toggle("active", arr.includes(v));
        saveProfile();
      });
    });
    $("#pf-grade").addEventListener("change", (e) => { state.profile.grade = e.target.value; saveProfile(); });
    $("#pf-major").addEventListener("input", (e) => { state.profile.major = e.target.value; saveProfile(); });
    $("#pf-skills").addEventListener("input", (e) => { state.profile.skills = e.target.value; saveProfile(); });
    $("#pf-team").addEventListener("input", (e) => { state.profile.teamSize = Number(e.target.value) || 1; saveProfile(); });
    $("#pf-save").addEventListener("click", () => {
      saveProfile();
      toast("画像已保存 ✓");
      handleInput("我适合报哪个赛道");
      showPanel("chat");
    });
  }

  // ---------- 知识库面板 ----------
  function renderKbPanel() {
    const list = $("#kbList");
    const comps = allComps();
    list.innerHTML = comps.map((c) =>
      '<div class="kb-item" data-id="' + esc(c.id) + '">' +
        '<div class="kb-item-head"><span class="comp-ico">' + icon("book") + "</span>" +
          '<div class="kb-item-title">' + esc(c.name) + "</div></div>" +
        '<div class="kb-item-meta">' + esc(c.audience) + "</div>" +
        '<div class="kb-item-foot"><span class="chip">' + (c.tracks || []).length + " 个赛道/类别</span>" +
        (c.id.startsWith("custom-") ? '<button class="kb-del" data-id="' + esc(c.id) + '">' + icon("trash") + "</button>" : "") + "</div>" +
      "</div>"
    ).join("");
    $("#kbCount").textContent = comps.length + " 场赛事 · " + comps.reduce((a, c) => a + (c.tracks || []).length, 0) + " 个赛道/类别";
  }

  function renderDetail(compId) {
    const comp = allComps().find((c) => c.id === compId);
    if (!comp) return;
    const el = $("#kbDetail");
    const tracks = (comp.tracks || []).map((t) =>
      '<div class="detail-track" data-track="' + esc(t.name) + '"><span class="comp-ico small">' + icon(t.icon) + "</span><div><div class='comp-name'>" + esc(t.name) + "</div><div class='comp-meta'>" + esc(t.summary) + "</div></div></div>"
    ).join("");
    el.innerHTML =
      '<div class="detail-head"><div class="comp-name big">' + esc(comp.name) + "</div>" +
      '<div class="chip chip-deadline">⏰ ' + daysUntil(comp.deadline) + " 天截止 · " + esc(comp.deadline) + "</div></div>" +
      '<div class="facts">' +
        factRow("主办", comp.organizer) +
        factRow("对象", comp.audience) +
        factRow("主题", comp.theme || "—") +
      "</div>" +
      '<div class="section-title">赛道 / 类别（' + (comp.tracks || []).length + "）</div>" +
      '<div class="detail-tracks">' + (tracks || '<div class="md dim">暂无赛道信息</div>') + "</div>" +
      '<div class="section-title">报送方式</div>' +
      '<div class="facts">' +
        factRow("邮箱", comp.submit.email) +
        factRow("纸质", comp.submit.paper) +
        factRow("联系人", comp.submit.contact + " · " + comp.submit.phone) +
      "</div>" +
      '<div class="section-title">奖励与规则</div>' +
      '<div class="md">' + esc(comp.rewards) + "</div>" +
      '<ul class="checklist">' + (comp.rules || []).map((r) => "<li>" + esc(r) + "</li>").join("") + "</ul>";
    $("#kbDetailPanel").classList.add("open");
  }

  function bindKb() {
    $("#kbList").addEventListener("click", (e) => {
      const del = e.target.closest(".kb-del");
      if (del) {
        const id = del.dataset.id;
        state.customComps = state.customComps.filter((c) => c.id !== id);
        saveCustomComps();
        renderKbPanel();
        return;
      }
      const item = e.target.closest(".kb-item");
      if (item) renderDetail(item.dataset.id);
    });
    $("#kbDetailPanel").addEventListener("click", (e) => {
      if (e.target.closest(".detail-close") || e.target.id === "kbDetailPanel") {
        $("#kbDetailPanel").classList.remove("open");
      }
      const t = e.target.closest(".detail-track");
      if (t) {
        const name = t.dataset.track;
        showPanel("chat");
        handleInput(name + " 是什么，需要准备什么材料");
      }
    });
    $("#addCompBtn").addEventListener("click", () => $("#addCompPanel").classList.add("open"));
    $("#addCompBtn2").addEventListener("click", () => $("#addCompPanel").classList.add("open"));
    $("#addCompPanel").addEventListener("click", (e) => {
      if (e.target.id === "addCompPanel" || e.target.closest(".add-close")) $("#addCompPanel").classList.remove("open");
    });
    $("#addCompSubmit").addEventListener("click", addCustomComp);
  }

  function addCustomComp() {
    const name = $("#ac-name").value.trim();
    const audience = $("#ac-audience").value.trim();
    const deadline = $("#ac-deadline").value;
    const organizer = $("#ac-organizer").value.trim();
    const submit = $("#ac-submit").value.trim();
    if (!name) { toast("请填写赛事名称"); return; }
    const comp = {
      id: "custom-" + Date.now(),
      name,
      shortName: name,
      type: "自定义",
      audience: audience || "待补充",
      audienceHint: audience || "",
      organizer: organizer || "待补充",
      theme: "",
      deadline: deadline || KB.defaultDeadline,
      publishRange: "",
      submit: { email: submit || "待补充", paper: "待补充", contact: "待补充", phone: "" },
      rewards: "待补充",
      rules: [],
      tracks: [],
      tags: []
    };
    state.customComps.unshift(comp);
    saveCustomComps();
    ["ac-name", "ac-audience", "ac-deadline", "ac-organizer", "ac-submit"].forEach((id) => { $("#" + id).value = ""; });
    $("#addCompPanel").classList.remove("open");
    renderKbPanel();
    toast("已添加到知识库 ✓");
  }

  // ---------- 面板切换 ----------
  function showPanel(name) {
    state.activePanel = name;
    $$(".panel").forEach((p) => p.classList.toggle("active", p.id === "panel-" + name));
    $$(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.panel === name));
    if (name === "kb") renderKbPanel();
    if (name === "profile") syncProfileForm();
    $("#sidebar").classList.remove("open");
    $("#sidebarBackdrop").classList.remove("show");
  }

  // ---------- toast ----------
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 1800);
  }

  // ---------- AI 大脑（大模型接入）----------
  function updateAIStatus() {
    const el = $("#aiStatus");
    if (!el) return;
    if (isLLMReady()) {
      el.innerHTML = '<span class="dot dot-ai"></span>AI 大脑已连接 · ' + esc(state.llm.model);
    } else {
      el.innerHTML = '<span class="dot"></span>知识库已就绪 · 规则模式';
    }
  }

  function buildSystemPrompt() {
    const comps = KB.competitions.map((c) => c.name + "（截止 " + c.deadline + "）").join("、");
    const tracks = KB.competitions[0].tracks.map((t) => t.name).join("、");
    const p = state.profile;
    const profileTxt = p.grade || p.major || p.skills ? ("年级 " + (p.grade || "未填") + "，专业 " + (p.major || "未填") + "，技能 " + (p.skills || "未填")) : "未填写";
    return (
      "你是「桂工赛智通」，一个面向桂林理工大学大学生的竞赛服务智能体。你的职责是帮学生查比赛、选赛道、判断资格、列材料清单、生成参赛方案和作品创意。\n" +
      "知识库包含：校内赛事（" + comps + "），大学生网络文化节 7 个赛道（" + tracks + "），以及 84 项全国大学生权威竞赛。\n" +
      "当前用户画像：" + profileTxt + "。\n" +
      "要求：回答用简体中文，语气友好、条理清晰、具体可操作；涉及时间必须标注“以当年官方通知为准”；不要编造不存在的报名链接和邮箱。"
    );
  }

  async function callLLM(userText) {
    const body = {
      model: state.llm.model,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: userText }
      ],
      temperature: 0.7,
      max_tokens: 1200
    };
    let url = state.llm.baseUrl.replace(/\/+$/, "");
    if (!/\/chat\/completions$/.test(url)) url += "/chat/completions";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + state.llm.apiKey
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error("请求失败 " + res.status + (err ? "：" + err.slice(0, 180) : ""));
    }
    const data = await res.json();
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return content || "（模型没有返回内容）";
  }

  function bindSettings() {
    const presets = LLM_PROVIDERS;
    const sync = () => {
      const el = $("#llm-provider");
      const sel = el.value;
      state.llm.provider = sel;
      const p = presets[sel];
      if (p && $("#llm-base").value.trim() === "" || (p.base && $("#llm-base").dataset.auto === "1")) {
        $("#llm-base").value = p.base;
        $("#llm-model").value = p.model;
        $("#llm-base").dataset.auto = "1";
      }
    };
    // 初始填充
    $("#llm-provider").value = state.llm.provider || "openrouter";
    $("#llm-base").value = state.llm.baseUrl || presets[state.llm.provider]?.base || "";
    $("#llm-model").value = state.llm.model || presets[state.llm.provider]?.model || "";
    $("#llm-key").value = state.llm.apiKey || "";
    $("#llm-provider").addEventListener("change", () => {
      const p = presets[$("#llm-provider").value];
      $("#llm-base").value = p.base;
      $("#llm-model").value = p.model;
    });
    $("#llm-base").addEventListener("input", () => { $("#llm-base").dataset.auto = "0"; });
    $("#llm-test").addEventListener("click", async () => {
      state.llm.provider = $("#llm-provider").value;
      state.llm.baseUrl = $("#llm-base").value.trim();
      state.llm.model = $("#llm-model").value.trim();
      state.llm.apiKey = $("#llm-key").value.trim();
      saveLLM();
      updateAIStatus();
      if (!isLLMReady()) { toast("请填写完整后再测试"); return; }
      $("#llm-test").textContent = "连接中…";
      $("#llm-test").disabled = true;
      try {
        const reply = await callLLM("你好，请用一句话介绍你自己。");
        toast("AI 大脑已连接 ✓");
        pushMessage('<div class="md"><strong>AI 大脑连接成功</strong>，它说：</div><div class="md dim">' + esc(reply) + "</div>", "agent");
        $("#settingsPanel").classList.remove("open");
      } catch (err) {
        toast("连接失败：" + err.message.slice(0, 60));
        pushMessage('<div class="md"><strong>连接失败</strong></div><div class="md dim">' + esc(err.message) + '</div><div class="md dim">常见原因：Key 无效 / 接口地址不对 / 浏览器 CORS 拦截。若直连被拦，可改用 OpenRouter，或用服务器代理。</div>', "agent");
      }
      $("#llm-test").textContent = "保存并测试连接";
      $("#llm-test").disabled = false;
    });
    $("#settingsBtn").addEventListener("click", () => $("#settingsPanel").classList.add("open"));
    $("#settingsPanel").addEventListener("click", (e) => {
      if (e.target.id === "settingsPanel" || e.target.closest(".add-close")) $("#settingsPanel").classList.remove("open");
    });
  }

  // ---------- 初始化 ----------
  function init() {
    pushMessage(buildGreeting(), "agent");
    renderSuggestions({});
    syncProfileForm();
    renderKbPanel();
    updateAIStatus();

    $("#sendBtn").addEventListener("click", () => {
      const inp = $("#input");
      const v = inp.value;
      inp.value = "";
      handleInput(v);
    });
    $("#input").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const inp = $("#input");
        const v = inp.value;
        inp.value = "";
        handleInput(v);
      }
    });

    $$(".nav-item").forEach((n) => n.addEventListener("click", () => showPanel(n.dataset.panel)));
    $$("[data-nav]").forEach((n) => n.addEventListener("click", () => showPanel(n.dataset.panel)));
    $("#menuBtn").addEventListener("click", () => {
      const open = $("#sidebar").classList.toggle("open");
      $("#sidebarBackdrop").classList.toggle("show", open);
    });
    $("#sidebarBackdrop").addEventListener("click", () => {
      $("#sidebar").classList.remove("open");
      $("#sidebarBackdrop").classList.remove("show");
    });

    document.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-say]");
      if (chip) handleInput(chip.dataset.say);
      const comp = e.target.closest(".comp-card");
      if (comp && !e.target.closest("button")) {
        showPanel("kb");
        renderDetail(comp.dataset.id);
      }
    });

    bindProfile();
    bindKb();
    bindSettings();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
