import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Server, HardDrive, Cpu, MemoryStick, Shield, Zap, ChevronRight, RefreshCw, Check, X, Sparkles, Building2, Users, Briefcase, ArrowRight, Save, Trash2, Brain, Flame, Target, AlertCircle } from 'lucide-react';

// ============ SAFE STORAGE (no-ops in sandboxed artifact preview, works on deploy) ============
const storage = {
  available: (() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const k = '__test__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch { return false; }
  })(),
  get(key, fallback) {
    if (!this.available) return fallback;
    try {
      const v = window.localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    if (!this.available) return;
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
};

const LS_KEYS = {
  cardProgress: 'dellbench.cardProgress.v1',
  savedQuotes: 'dellbench.savedQuotes.v1',
};

// ============ PRODUCT DATA ============
const POWEREDGE = [
  { id: 'r660', name: 'PowerEdge R660', form: '1U Rack', socket: 2, maxCpu: 'Xeon 4th/5th Gen, up to 56C/socket', maxRam: '8TB DDR5 (32 DIMM)', maxDrives: '10x 2.5" NVMe', basePrice: 4200, cpuPrice: 1800, ramPricePerGB: 8, storagePricePerTB: 240, workloads: ['Virtualization', 'Database', 'VDI', 'Cloud-native'], pitch: 'The dense 1U workhorse. Best when rack space is gold and the workload is VMware, SQL, or scale-out web tier.' },
  { id: 'r670', name: 'PowerEdge R670', form: '1U Rack', socket: 2, maxCpu: 'Xeon 6 (Granite Rapids), up to 86C/socket', maxRam: '8TB DDR5 / MRDIMM', maxDrives: '10x EDSFF E3.S', basePrice: 5400, cpuPrice: 2600, ramPricePerGB: 9, storagePricePerTB: 280, workloads: ['AI inference', 'In-memory DB', 'HFT', 'Next-gen virt'], pitch: '17G refresh. Sell this when the customer talks about "future-proof" or refresh cycles past 2028.' },
  { id: 'r760', name: 'PowerEdge R760', form: '2U Rack', socket: 2, maxCpu: 'Xeon 4th/5th Gen, up to 64C/socket', maxRam: '8TB DDR5 (32 DIMM)', maxDrives: '24x 2.5" NVMe / 12x 3.5"', basePrice: 5800, cpuPrice: 2000, ramPricePerGB: 8, storagePricePerTB: 220, workloads: ['Mixed workload', 'AI/ML', 'Storage-heavy DB', 'Backup target'], pitch: 'The flagship 2U generalist. If they\'re unsure, this fits. More drives, more PCIe, room for a GPU.' },
  { id: 'r760xa', name: 'PowerEdge R760xa', form: '2U Rack (accelerator)', socket: 2, maxCpu: 'Xeon 4th/5th Gen, up to 56C/socket', maxRam: '4TB DDR5', maxDrives: '8x 2.5" NVMe', basePrice: 12500, cpuPrice: 2400, ramPricePerGB: 9, storagePricePerTB: 240, workloads: ['AI training (mid)', 'GPU inference', 'CAE/CAD', 'Visualization'], pitch: 'Up to 4x double-wide GPUs (H100, MI300X). Bridge between a one-GPU server and a full XE9680. AI conversations start here.' },
  { id: 'r860', name: 'PowerEdge R860', form: '2U Rack (4-socket)', socket: 4, maxCpu: 'Xeon 4th Gen, up to 60C/socket', maxRam: '16TB DDR5 (64 DIMM)', maxDrives: '32x EDSFF', basePrice: 18000, cpuPrice: 4500, ramPricePerGB: 10, storagePricePerTB: 250, workloads: ['SAP HANA', 'Oracle DB', 'Dense virt', 'In-memory analytics'], pitch: '4-socket in a 2U is the rare unicorn. SAP HANA, big Oracle, anything memory-bound. Premium ASP.' },
  { id: 'r960', name: 'PowerEdge R960', form: '4U Rack (4-socket)', socket: 4, maxCpu: 'Xeon 4th Gen, up to 60C/socket', maxRam: '16TB DDR5', maxDrives: '24x 2.5" NVMe', basePrice: 22000, cpuPrice: 4500, ramPricePerGB: 10, storagePricePerTB: 250, workloads: ['Mission-critical DB', 'ERP', 'Scale-up apps', 'Tier-1 workloads'], pitch: 'Same compute as R860, more storage + expansion. When the customer says "this app cannot go down."' },
  { id: 'xe9680', name: 'PowerEdge XE9680', form: '6U AI Server', socket: 2, maxCpu: 'Xeon 4th/5th Gen', maxRam: '4TB DDR5', maxDrives: '16x EDSFF E3.S', basePrice: 280000, cpuPrice: 3500, ramPricePerGB: 10, storagePricePerTB: 300, workloads: ['LLM training', 'Foundation models', 'Generative AI', 'HPC'], pitch: '8x H100/H200/MI300X. The biggest-ticket SKU you\'ll quote. Six-figure deals start here.' },
];

const POWERSTORE = [
  { id: '500t', name: 'PowerStore 500T', cores: 24, mem: 192, maxDrives: 97, maxVolumes: 1500, basePrice: 38000, perTBprice: 380, pitch: 'Entry-level. ROBO, small datacenter, departmental.' },
  { id: '1200t', name: 'PowerStore 1200T', cores: 40, mem: 384, maxDrives: 93, maxVolumes: 6000, basePrice: 65000, perTBprice: 360, pitch: 'Mid-market sweet spot. Most common quote.' },
  { id: '3200t', name: 'PowerStore 3200T', cores: 64, mem: 768, maxDrives: 93, maxVolumes: 10000, basePrice: 110000, perTBprice: 340, pitch: 'Enterprise general purpose. Mixed block + file.' },
  { id: '5200t', name: 'PowerStore 5200T', cores: 96, mem: 1152, maxDrives: 93, maxVolumes: 16000, basePrice: 180000, perTBprice: 320, pitch: 'High-performance tier. Latency-sensitive apps.' },
  { id: '9200t', name: 'PowerStore 9200T', cores: 112, mem: 2560, maxDrives: 93, maxVolumes: 32000, basePrice: 280000, perTBprice: 310, pitch: 'Top of stack. Mission-critical, max consolidation.' },
];

const VOLUME_TIERS = [
  { min: 0, max: 25000, discount: 0.00, label: 'List' },
  { min: 25000, max: 75000, discount: 0.08, label: 'Tier 1' },
  { min: 75000, max: 200000, discount: 0.15, label: 'Tier 2' },
  { min: 200000, max: 500000, discount: 0.22, label: 'Tier 3' },
  { min: 500000, max: Infinity, discount: 0.30, label: 'Strategic' },
];

const SUPPORT_OPTIONS = [
  { id: 'basic', label: 'Basic NBD', mult: 0.05, years: 3, desc: 'Next business day, 3yr' },
  { id: 'prosupport', label: 'ProSupport', mult: 0.12, years: 3, desc: '24x7, 4hr response, 3yr' },
  { id: 'pluspro', label: 'ProSupport Plus', mult: 0.20, years: 4, desc: 'Predictive, SAM, 4yr' },
  { id: 'pluspro5', label: 'ProSupport Plus 5yr', mult: 0.27, years: 5, desc: 'Highest margin · lead with this' },
];

// ============ FLASHCARDS (expanded to 55) ============
const FLASHCARDS = [
  // Positioning (PowerEdge)
  { id: 'pe1', q: 'When would you recommend a PowerEdge R660 over an R760?', a: 'When rack density matters more than expansion. R660 is 1U for high server-per-rack ratios; R760 is 2U with more drives, PCIe slots, and GPU room. Hosters and dense VMware clusters → R660. Mixed workloads or storage-heavy → R760.', cat: 'Positioning' },
  { id: 'pe2', q: 'What\'s the differentiator for PowerEdge R860?', a: '4 sockets in a 2U chassis — extremely rare. Up to 64 DIMMs and 16TB RAM. The pitch is in-memory workloads (SAP HANA, Oracle in-memory, dense virt) where memory-per-rack-U is the binding constraint.', cat: 'Positioning' },
  { id: 'pe3', q: 'R860 vs R960 — when do you pick which?', a: 'Same compute (4-socket, up to 60C/socket, 16TB RAM). R860 is 2U → density. R960 is 4U → more drives, more PCIe, more expansion. R960 when storage or I/O is part of the workload (mission-critical DB, ERP). R860 when memory is everything.', cat: 'Positioning' },
  { id: 'pe4', q: 'What\'s the R660xs and who is it for?', a: 'A cost-optimized R660. 1U, 1DPC design (one DIMM per channel) which trades max memory capacity for higher memory speed. Sweet spot: scale-out HPC clusters, web tier, dense single-socket-style deployments where customer cares about $/node not max memory.', cat: 'Positioning' },
  { id: 'pe5', q: 'When does R760xa beat XE9680?', a: 'R760xa = up to 4 PCIe GPUs in 2U, ~$15-50k range. XE9680 = 8 SXM GPUs in 6U, $250k+. Pick R760xa for inference, mid-scale training, CAD/visualization, or customers dipping a toe in AI. XE9680 is for production LLM training and serious HPC.', cat: 'Positioning' },
  { id: 'pe6', q: 'When would you quote a tower (T-series) over a rack?', a: 'ROBO (remote/branch office), small business with no datacenter, retail back-office, dental/medical offices. Anywhere there\'s no rack and the customer wants a "server that sits in a closet." T350, T550 are the common SKUs.', cat: 'Positioning' },

  // Positioning (PowerStore)
  { id: 'ps1', q: 'Customer is a 200-person SMB needing first SAN. What do you quote?', a: 'PowerStore 500T or 1200T. 500T if budget is tight and growth is slow. 1200T is the sweet spot — more performance, room to scale, and the SKU you\'ll be most successful selling. Bundle ProSupport Plus 4yr.', cat: 'Positioning' },
  { id: 'ps2', q: 'What\'s the difference between PowerStore T and Q models?', a: 'T = traditional (NVMe SSD/TLC). Q (3200Q, 5200Q) = denser/QLC-flash optimized for capacity-heavy workloads at lower $/GB. Quote Q when customer prioritizes capacity over peak IOPS — backup repositories, archive, mixed-tier consolidation.', cat: 'Positioning' },
  { id: 'ps3', q: 'When do you reach for PowerStore vs PowerMax?', a: 'PowerStore = unified (block + file), mid-range, scale-out, broadest fit. PowerMax = tier-0 mainframe-class, microsecond latency, mission-critical block only. If they say "we run a stock exchange" or "mainframe-attached" → PowerMax. Otherwise → PowerStore.', cat: 'Positioning' },
  { id: 'ps4', q: 'When do you reach for PowerStore vs PowerScale?', a: 'PowerStore = block + file, transactional workloads. PowerScale = scale-out NAS for massive unstructured data (media, genomics, AI training data lakes). If the conversation is "we have 5 PB of files and it\'s growing" → PowerScale.', cat: 'Positioning' },

  // Storage tech
  { id: 'st1', q: 'How is PowerStore different from a traditional SAN?', a: 'Active/active dual-node architecture with end-to-end NVMe, built-in data reduction (typically 4:1 guaranteed), and AppsON — running VMs directly on the array. PowerStoreOS is container-based, enabling non-disruptive upgrades.', cat: 'Storage' },
  { id: 'st2', q: 'What is AppsON?', a: 'PowerStore feature that lets you run VMs directly on the storage array using its onboard ESXi. Use case: edge sites that need both compute and storage in one box. Differentiator — most competitors can\'t do this.', cat: 'Storage' },
  { id: 'st3', q: 'Explain Dynamic Resiliency Engine (DRE).', a: 'PowerStore\'s data protection layer. Distributes data across drives so the array survives multiple simultaneous drive failures without rebuild storms. Sales angle: faster rebuild, better uptime, less risk than traditional RAID.', cat: 'Storage' },
  { id: 'st4', q: 'What protocols does PowerStore support?', a: 'Block: iSCSI, FC, NVMe/FC, NVMe/TCP. File: NFS, SMB. vVols for VMware. The NVMe-over-fabric support is the modern story — pitch it when latency comes up.', cat: 'Storage' },
  { id: 'st5', q: 'What\'s the PowerStore data reduction guarantee?', a: '4:1 data reduction guaranteed (write to Dell, in the contract). Compression + dedup + pattern detection happens inline. For mixed workloads customers often see 5:1 or better. Always factor this into the usable-capacity math when quoting.', cat: 'Storage' },
  { id: 'st6', q: 'When would you add PowerProtect to a deal?', a: 'Always offer it — backup is non-negotiable. PowerProtect DD (Data Domain) for backup target, PowerProtect Data Manager for the software side. Cyber Recovery Vault for ransomware-conscious customers (banks, healthcare, gov).', cat: 'Storage' },

  // AI/ML
  { id: 'ai1', q: 'Customer says "we\'re going all-in on AI." What do you quote?', a: 'Anchor with XE9680 (8-GPU flagship) for training, R760xa for inference/mid-training, R670 if Granite Rapids CPU inference fits. Wrap with PowerScale for unstructured data, PowerSwitch Z9664F for the fabric. Always pull in an AI specialist.', cat: 'AI/ML' },
  { id: 'ai2', q: 'What GPUs ship in the XE9680?', a: 'NVIDIA H100 SXM, H200 SXM, B100/B200 (Blackwell, current), or AMD MI300X. 8 GPUs per chassis, NVLink/Infinity Fabric interconnected. Always ask which framework (PyTorch, TF) and model size — drives GPU choice.', cat: 'AI/ML' },
  { id: 'ai3', q: 'DLC — what is it and who cares?', a: 'Direct Liquid Cooling. Required for high-TDP Xeons and dense GPU configs (R760xa, XE9680). Customer needs rack manifolds + CDU (cooling distribution unit). Bring this up early in AI deals — it changes facilities planning and project timelines.', cat: 'AI/ML' },
  { id: 'ai4', q: 'What\'s the Dell AI Factory?', a: 'Dell + NVIDIA validated reference architecture for end-to-end AI. Combines compute (XE/R-series), storage (PowerScale), networking (PowerSwitch), and software (NIM, Run:ai, NeMo). Sales angle: "we de-risk the whole stack, not just sell you GPUs."', cat: 'AI/ML' },
  { id: 'ai5', q: 'Customer says "we just need GPUs, the cloud is too expensive." Pitch?', a: 'TCO model: on-prem GPUs break even vs cloud H100s typically in 12-18 months for sustained use. Add APEX Flex on Demand for Opex-friendly model. Bring up data gravity (training data is huge, egress is expensive) and security (their IP doesn\'t leave the building).', cat: 'AI/ML' },
  { id: 'ai6', q: 'What networking does an AI cluster need?', a: '400GbE or InfiniBand fabric. PowerSwitch Z9664F (64-port 400GbE) is Dell\'s answer. For largest clusters, NVIDIA Quantum-2 IB. Two networks usually: compute fabric (east-west between GPUs) and storage fabric. Bring in network specialist.', cat: 'AI/ML' },

  // Services
  { id: 'sv1', q: 'Difference between ProSupport and ProSupport Plus?', a: 'ProSupport: 24x7, 4hr onsite, parts. ProSupport Plus adds: predictive analytics (SupportAssist), a Service Account Manager (SAM), 3rd-party software collaborative support, priority routing. PSP is your margin play — always quote it.', cat: 'Services' },
  { id: 'sv2', q: 'What does APEX mean and when do you bring it up?', a: 'Dell\'s consumption / as-a-service portfolio. Bring it up when customer talks Opex vs Capex, cloud repatriation, unpredictable growth, or budget constraints. APEX Flex on Demand = pay-per-use on owned hardware; APEX Compute / Storage = full as-a-service.', cat: 'Services' },
  { id: 'sv3', q: 'Why quote 5-year ProSupport Plus over 3-year?', a: 'Higher attach value, locks customer in past the next refresh decision, and the customer doesn\'t feel a "renewal cliff." Margin per year is similar but the total deal is larger. Most customers accept 5yr without pushback if it\'s the default option in the quote.', cat: 'Services' },
  { id: 'sv4', q: 'What is Deployment Services and when do you attach it?', a: 'Dell-led install: rack/stack, firmware updates, OS install, initial config, validation. Attach when customer\'s IT team is small, geographically distributed, or doing a large rollout. ProDeploy and ProDeploy Plus are the SKUs.', cat: 'Services' },
  { id: 'sv5', q: 'What\'s SupportAssist?', a: 'Dell\'s telemetry/predictive tool. Phones home with health data, predicts failures, opens cases proactively, can auto-dispatch parts. Included with ProSupport Plus. Sell as "your servers will tell us they need help before you notice."', cat: 'Services' },
  { id: 'sv6', q: 'What is Keep Your Hard Drive (KYHD)?', a: 'Add-on service: if a drive fails, Dell ships a replacement but the failed drive stays with the customer (for disposal/destruction). Required for HIPAA/PCI/classified environments. Easy attach in regulated industries — never let those deals go without it.', cat: 'Services' },

  // Tech / Management
  { id: 'tc1', q: 'What\'s iDRAC and why does it matter to the customer?', a: 'Integrated Dell Remote Access Controller — out-of-band management. Lets admins power-cycle, install OS, monitor health, push firmware, all without being onsite. iDRAC 10 (current) ties into OpenManage and CloudIQ. Big TCO/Opex story.', cat: 'Tech' },
  { id: 'tc2', q: 'What is OpenManage Enterprise?', a: 'Dell\'s free fleet management console. One pane for firmware, configuration, monitoring across all PowerEdge. Differentiator vs competitors who charge for the equivalent. Use as a "free included value" talking point.', cat: 'Tech' },
  { id: 'tc3', q: 'What is CloudIQ?', a: 'Dell\'s cloud-based, AI-driven monitoring/analytics across PowerEdge, PowerStore, PowerScale, etc. Anomaly detection, capacity forecasting, cybersecurity risk scoring. Free with ProSupport. Reinforces the "Dell stack is smarter together" narrative.', cat: 'Tech' },
  { id: 'tc4', q: 'iDRAC 9 vs iDRAC 10 — what changed?', a: 'iDRAC 10 ships with 16G+ servers (and is standard on 17G like R670/R770). Faster boot/UI, hardware root of trust enhancements, telemetry streaming improvements, better integration with CloudIQ. If customer asks "do I get iDRAC 10" — only on new gens.', cat: 'Tech' },
  { id: 'tc5', q: 'What\'s Secured Component Verification (SCV)?', a: 'Cryptographic supply chain assurance — Dell signs a certificate listing every component shipped in the server. Customer can verify on arrival that nothing was swapped in transit. Big for government, defense, finance. Free feature, big trust signal.', cat: 'Tech' },
  { id: 'tc6', q: 'What is BOSS and why does it matter?', a: 'Boot Optimized Storage Solution — dedicated M.2 NVMe card for the OS, separate from data drives. BOSS-N1 is the current version. Sell as: faster boot, OS doesn\'t consume a data drive slot, RAID-1 redundancy for the OS volume.', cat: 'Tech' },
  { id: 'tc7', q: 'What\'s the difference between Gen5 SSD and Gen4?', a: 'Gen5 NVMe SSDs in E3.S form factor: roughly 2x sequential bandwidth of Gen4, ~30% lower latency, 7mm thickness (vs 15mm) means more density. R660 fits 60% more drives with Gen5 E3.S. Sell when customer cares about IOPS or rack-U economics.', cat: 'Tech' },
  { id: 'tc8', q: 'What is OME-M (OpenManage Enterprise Modular)?', a: 'OpenManage variant for MX7000 modular/blade chassis. Single-pane for the MX kinetic infrastructure. Only relevant for customers using MX — but when they are, this is the management story.', cat: 'Tech' },

  // Competitive
  { id: 'cm1', q: 'Customer compares R760 to HPE DL380. Top 3 talking points?', a: '1) APEX Flex on Demand — consumption pricing HPE can\'t match at scale. 2) Dell\'s direct service model vs HPE channel can mean faster parts/response. 3) CloudIQ + OpenManage integration depth across the broader Dell stack. Avoid spec-war: pivot to TCO and ecosystem.', cat: 'Competitive' },
  { id: 'cm2', q: 'Customer compares PowerStore vs HPE Alletra. What do you say?', a: 'AppsON (run VMs on the array — Alletra can\'t). 4:1 data reduction guarantee in writing. Unified block + file in one box (Alletra splits). Non-disruptive upgrades via container-based PowerStoreOS. Better attach to broader Dell stack (PowerProtect, PowerScale).', cat: 'Competitive' },
  { id: 'cm3', q: 'Customer compares PowerEdge to Lenovo ThinkSystem. Angle?', a: 'Lenovo plays on price. Counter with: service depth (Lenovo channel-only in most regions), Dell-owned manufacturing and supply chain, broader portfolio attach (storage, networking, services). For AI, Dell\'s NVIDIA partnership depth and reference architectures are unmatched.', cat: 'Competitive' },
  { id: 'cm4', q: 'Customer compares XE9680 vs Supermicro AI server. Angle?', a: 'Supermicro = cheaper, less validated. Dell = enterprise support, supply chain assurance, validated reference architectures with NVIDIA, full-stack accountability when something breaks. Sell the "throat to choke" story — one vendor for compute, storage, networking, services.', cat: 'Competitive' },
  { id: 'cm5', q: 'Customer says "Cisco UCS has better management." Response?', a: 'Acknowledge UCS service profiles were innovative. But OpenManage + CloudIQ have closed that gap, and Dell\'s management is free where UCS Manager + Intersight have licensing. Also: Cisco is exiting/de-emphasizing rack server space — refresh risk for the customer.', cat: 'Competitive' },
  { id: 'cm6', q: 'Customer threatens to move to public cloud. How do you respond?', a: 'Don\'t fight the cloud — fight the assumption it\'s cheaper. Walk through 3-year TCO including egress, instance reservations, support. Bring up APEX Flex on Demand (consumption on-prem). Highlight repatriation trend (Dropbox, 37signals, etc). Then ask which workloads — some belong in cloud.', cat: 'Competitive' },

  // Sales motion / Process
  { id: 'sm1', q: 'What is deal registration and why does it matter?', a: 'Process where a partner registers a deal with Dell to lock in extra discount + protect against other partners pricing it. As IPS, you\'ll work deal reg requests constantly. Approval depends on incumbency, deal size, end-customer logo. Speed matters — partners want a fast answer.', cat: 'Sales Motion' },
  { id: 'sm2', q: 'What\'s the difference between BUY and SELL prices in a quote?', a: 'BUY = what the partner/customer pays Dell. SELL = what the partner charges their end-customer (their margin baked in). On direct deals you only see one. On channel deals, both. Never share SELL price across partner accounts — confidential.', cat: 'Sales Motion' },
  { id: 'sm3', q: 'What is MEDDICC?', a: 'Qualification framework: Metrics, Economic buyer, Decision criteria, Decision process, Identify pain, Champion, Competition. Used to qualify whether a deal is real. If you can\'t fill in all 7, the deal isn\'t qualified — and your manager will ask you about every letter.', cat: 'Sales Motion' },
  { id: 'sm4', q: 'What is a SPIFF or Sales Performance Incentive?', a: 'Short-term commission booster on specific products/SKUs Dell wants to push. Common on new product launches, slow-moving inventory, or strategic services like ProSupport Plus. Always check the current SPIFF list — easy way to make extra comp.', cat: 'Sales Motion' },
  { id: 'sm5', q: 'What does "quote-to-cash" mean?', a: 'The end-to-end process: configure → quote → customer PO → order entry → fulfillment → invoice → cash. As IPS, you live in the first three stages. Knowing the full chain helps when partners ask about order status or delivery commits.', cat: 'Sales Motion' },
  { id: 'sm6', q: 'What\'s a BAFO?', a: 'Best And Final Offer. Customer\'s "give me your final number" moment. Don\'t actually go to final on first BAFO — leave a small lever. But don\'t play games either; sophisticated buyers see through it. Coordinate with manager on big deals.', cat: 'Sales Motion' },
  { id: 'sm7', q: 'How do you handle a customer asking for a discount you can\'t approve?', a: 'Three moves: 1) Ask what they\'re trying to hit — is it a budget line, a competitive quote, or just sport? 2) Trade for something (longer term, more services, multi-year). 3) Escalate to manager with deal justification. Never just say no — find what unlocks more.', cat: 'Sales Motion' },

  // Discovery / Qualifying
  { id: 'dq1', q: 'What\'s the most important discovery question on a first call?', a: '"Walk me through what you\'re trying to accomplish and what\'s driving the timing." Two birds: surfaces business outcome AND tells you if there\'s an actual buying window. If they can\'t answer the timing half, deal is unqualified.', cat: 'Discovery' },
  { id: 'dq2', q: 'How do you identify the economic buyer?', a: 'Ask: "Who else signs off on a purchase this size?" or "Who owns the budget for this project?" Watch for vague answers — that\'s a signal you\'re talking to a recommender, not a decider. Always try to get to the EB before late-stage.', cat: 'Discovery' },
  { id: 'dq3', q: 'What\'s a "champion" and how do you build one?', a: 'A champion is an internal advocate who sells for you when you\'re not in the room. Build one by: giving them political wins (ammo for their boss), making them look smart, sharing competitive intel they can use. Test: would they take a call about your deal if you\'re sick?', cat: 'Discovery' },
  { id: 'dq4', q: 'How do you know if a deal is "stuck" vs "lost"?', a: 'Stuck: customer responds but won\'t commit. Lost: customer goes silent or vague. The test — ask for a specific next step ("can we get on the calendar Thursday?"). If they dodge, it\'s lost; just hasn\'t been said yet. Time to do a loss-call and find out why.', cat: 'Discovery' },
];

const CATS = Array.from(new Set(FLASHCARDS.map(c => c.cat)));

// ============ DISCOVERY DATA ============
const INDUSTRIES = ['Healthcare', 'Financial Services', 'Manufacturing', 'Education', 'Retail', 'Government', 'Tech / SaaS'];
const SIZES = ['SMB (<500)', 'Mid-market (500-5000)', 'Enterprise (5000+)'];
const PAINS = ['Aging infrastructure', 'AI/ML adoption', 'Cloud repatriation', 'Compliance / Security', 'Cost reduction', 'Performance issues', 'Data growth'];

const QUESTION_BANK = {
  base: [
    { type: 'Situation', q: 'Walk me through your current data center footprint — what\'s the rough mix of compute and storage?' },
    { type: 'Situation', q: 'What\'s your typical hardware refresh cycle, and where are you in it today?' },
    { type: 'Problem', q: 'What\'s the #1 thing your infrastructure team is losing sleep over right now?' },
    { type: 'Implication', q: 'If that issue continues another 12 months, what\'s the business impact?' },
    { type: 'Need-Payoff', q: 'If we could solve that, what would it unlock for the team or the business?' },
  ],
  pain: {
    'Aging infrastructure': [
      { type: 'Problem', q: 'What\'s out of warranty today, and what\'s coming up in the next 12 months?' },
      { type: 'Implication', q: 'When something fails on the older boxes, what\'s the average recovery time?' },
      { type: 'Need-Payoff', q: 'If maintenance windows dropped by 50%, where would your team spend that time instead?' },
    ],
    'AI/ML adoption': [
      { type: 'Situation', q: 'Are you training, fine-tuning, or just doing inference today?' },
      { type: 'Problem', q: 'Is the bottleneck GPU availability, data pipeline, or networking fabric?' },
      { type: 'Implication', q: 'How much faster could your data science team ship if compute weren\'t the constraint?' },
      { type: 'Need-Payoff', q: 'What\'s the business case your CIO needs to see to greenlight an AI infrastructure spend?' },
    ],
    'Cloud repatriation': [
      { type: 'Situation', q: 'Which workloads have you already moved back, and which are next on the list?' },
      { type: 'Problem', q: 'Is it cost, performance, data sovereignty, or all of the above driving the move?' },
      { type: 'Need-Payoff', q: 'Have you modeled the 3-year TCO of on-prem with APEX consumption pricing vs your current cloud spend?' },
    ],
    'Compliance / Security': [
      { type: 'Situation', q: 'Which frameworks are in scope — HIPAA, PCI, FedRAMP, SOC 2, all of them?' },
      { type: 'Problem', q: 'Where are your current audit gaps showing up?' },
      { type: 'Need-Payoff', q: 'Would a hardware root of trust + STIG-hardened platform change the conversation with your auditors?' },
    ],
    'Cost reduction': [
      { type: 'Situation', q: 'Is the mandate Opex reduction, Capex deferral, or total spend?' },
      { type: 'Problem', q: 'Where\'s the biggest line-item growth year over year?' },
      { type: 'Need-Payoff', q: 'If we could show 30%+ TCO savings with consolidation, who\'s the executive sponsor we need to bring in?' },
    ],
    'Performance issues': [
      { type: 'Problem', q: 'Which application is the loudest complainer, and what does "slow" mean in their terms?' },
      { type: 'Situation', q: 'Have you traced it to CPU, memory, storage IOPS, or network?' },
      { type: 'Need-Payoff', q: 'If that app ran 2x faster, what does the business actually do with it?' },
    ],
    'Data growth': [
      { type: 'Situation', q: 'What\'s your year-over-year growth rate, and what\'s the dominant data type?' },
      { type: 'Problem', q: 'Where are you hitting the wall — capacity, performance, or backup window?' },
      { type: 'Need-Payoff', q: 'Would built-in 4:1 data reduction change how you think about the next purchase?' },
    ],
  },
  industry: {
    'Healthcare': [{ type: 'Situation', q: 'How are you handling Epic or Cerner on the storage side today?' }],
    'Financial Services': [{ type: 'Problem', q: 'Where do latency-sensitive workloads (trading, risk) live, and how often do you tune them?' }],
    'Manufacturing': [{ type: 'Situation', q: 'What\'s the OT/IT integration look like — are you running edge compute in plants?' }],
    'Education': [{ type: 'Situation', q: 'Are you supporting research HPC clusters, or is this primarily admin/LMS workloads?' }],
    'Retail': [{ type: 'Problem', q: 'How do you handle seasonal demand spikes — overprovision, burst, or both?' }],
    'Government': [{ type: 'Situation', q: 'Are you on a specific contract vehicle — GSA, SEWP, NASPO — that I should align to?' }],
    'Tech / SaaS': [{ type: 'Problem', q: 'Where are you on the cloud-vs-colo debate for your production fleet?' }],
  },
};

const RECOMMEND_MAP = {
  'AI/ML adoption': ['XE9680', 'R760xa', 'PowerScale', 'PowerSwitch Z9664F'],
  'Aging infrastructure': ['R670 / R770 (17G refresh)', 'PowerStore 1200T+', 'ProSupport Plus'],
  'Cloud repatriation': ['R760 + PowerStore + APEX Flex on Demand', 'OpenManage Enterprise'],
  'Compliance / Security': ['PowerEdge with iDRAC10 + Secured Component Verification', 'PowerStore D@RE'],
  'Cost reduction': ['Consolidate to R860 (4-socket)', 'PowerStore 3200T (4:1 dedup)', 'APEX consumption model'],
  'Performance issues': ['R670 (Granite Rapids)', 'PowerStore 5200T / 9200T', 'NVMe-oF fabric'],
  'Data growth': ['PowerStore 3200T/5200T', 'PowerScale for unstructured', 'PowerProtect for backup'],
};

// ============ SM-2 LITE SPACED REPETITION ============
// Each card has: { ef (ease factor), interval (days until next review), reps, due (timestamp), lapses }
// Quality scale: 0 = wrong, 5 = perfect. We use 2-button: Missed (q=2), Got it (q=5)
function defaultProgress() {
  return { ef: 2.5, interval: 0, reps: 0, due: Date.now(), lapses: 0, lastSeen: null, totalSeen: 0, totalRight: 0 };
}

function applyReview(progress, quality) {
  let { ef, interval, reps, lapses, totalSeen, totalRight } = progress;
  totalSeen = (totalSeen || 0) + 1;
  if (quality >= 3) {
    totalRight = (totalRight || 0) + 1;
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 3;
    else interval = Math.round(interval * ef);
    reps += 1;
  } else {
    reps = 0;
    interval = 0; // re-show in same session
    lapses = (lapses || 0) + 1;
  }
  ef = Math.max(1.3, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  const due = Date.now() + interval * 24 * 60 * 60 * 1000;
  return { ef, interval, reps, due, lapses, lastSeen: Date.now(), totalSeen, totalRight };
}

function selectNextCard(allCards, allProgress) {
  const now = Date.now();
  const enriched = allCards.map(c => ({ card: c, prog: allProgress[c.id] || defaultProgress() }));
  // Priority: 1) Due cards, oldest due first. 2) New (never seen). 3) Future cards by least-soonest.
  const due = enriched.filter(e => e.prog.due <= now && e.prog.totalSeen > 0).sort((a, b) => a.prog.due - b.prog.due);
  const fresh = enriched.filter(e => e.prog.totalSeen === 0);
  if (due.length) return due[0].card;
  if (fresh.length) return fresh[Math.floor(Math.random() * fresh.length)].card;
  // All seen, none due — return the one closest to being due
  enriched.sort((a, b) => a.prog.due - b.prog.due);
  return enriched[0].card;
}

// ============ APP ============
export default function App() {
  const [tab, setTab] = useState('configurator');

  return (
    <div className="min-h-screen" style={{ background: '#F5F1E8', color: '#0A0A0A' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=JetBrains+Mono:wght@400;500;700&family=Inter+Tight:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter Tight', sans-serif; }
        .display { font-family: 'Fraunces', serif; font-optical-sizing: auto; letter-spacing: -0.02em; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .grain {
          background-image: radial-gradient(circle at 1px 1px, rgba(10,10,10,0.04) 1px, transparent 0);
          background-size: 20px 20px;
        }
        .number-tick { font-variant-numeric: tabular-nums; }
        select, input { font-family: 'Inter Tight', sans-serif; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #0A0A0A; }
      `}</style>

      <div className="grain min-h-screen">
        <header className="border-b-2 border-black">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-end justify-between flex-wrap gap-3">
            <div>
              <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-60">Inside Sales Field Kit / Vol. 02</div>
              <h1 className="display text-4xl md:text-5xl font-extrabold leading-none mt-1">
                The Dell Bench<span style={{ color: '#0066CC' }}>.</span>
              </h1>
            </div>
            <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-60 text-right">
              <div>Enterprise · PowerEdge / PowerStore</div>
              <div>Ramp toolkit for IPS reps</div>
              {!storage.available && (
                <div className="mt-1 px-2 py-1 inline-block" style={{ background: '#FFB800', color: '#0A0A0A' }}>
                  <AlertCircle className="inline w-3 h-3 mr-1 -mt-0.5" />
                  Storage off (preview mode)
                </div>
              )}
            </div>
          </div>

          <nav className="max-w-7xl mx-auto px-6 flex gap-0 -mb-[2px] flex-wrap">
            {[
              { id: 'configurator', label: '01 / Configurator', icon: Server },
              { id: 'flashcards', label: '02 / Flashcards', icon: Brain },
              { id: 'discovery', label: '03 / Discovery', icon: Users },
            ].map(t => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="px-5 py-3 mono text-[11px] uppercase tracking-wider border-2 border-b-0 transition-all"
                  style={{
                    background: active ? '#0A0A0A' : 'transparent',
                    color: active ? '#F5F1E8' : '#0A0A0A',
                    borderColor: active ? '#0A0A0A' : 'transparent',
                    marginRight: '-2px',
                  }}
                >
                  <t.icon className="inline w-3 h-3 mr-2 -mt-0.5" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {tab === 'configurator' && <Configurator />}
          {tab === 'flashcards' && <Flashcards />}
          {tab === 'discovery' && <Discovery />}
        </main>

        <footer className="border-t-2 border-black mt-12">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center flex-wrap gap-2">
            <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-60">
              Built for ramp / Not affiliated with Dell Technologies
            </div>
            <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-60">
              {FLASHCARDS.length} cards · spaced repetition · pricing illustrative
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ============ CONFIGURATOR (with saved quotes) ============
function Configurator() {
  const [productType, setProductType] = useState('compute');
  const [serverId, setServerId] = useState('r760');
  const [storageId, setStorageId] = useState('1200t');
  const [qty, setQty] = useState(4);
  const [cpus, setCpus] = useState(2);
  const [ramGB, setRamGB] = useState(256);
  const [storageTB, setStorageTB] = useState(15);
  const [support, setSupport] = useState('prosupport');
  const [savedQuotes, setSavedQuotes] = useState(() => storage.get(LS_KEYS.savedQuotes, []));
  const [quoteName, setQuoteName] = useState('');

  const product = productType === 'compute'
    ? POWEREDGE.find(p => p.id === serverId)
    : POWERSTORE.find(p => p.id === storageId);

  const quote = useMemo(() => {
    if (!product) return null;
    let perUnit = product.basePrice;
    if (productType === 'compute') {
      perUnit += cpus * product.cpuPrice;
      perUnit += ramGB * product.ramPricePerGB;
      perUnit += storageTB * product.storagePricePerTB;
    } else {
      perUnit += storageTB * product.perTBprice;
    }
    const subtotal = perUnit * qty;
    const tier = VOLUME_TIERS.find(t => subtotal >= t.min && subtotal < t.max);
    const discount = subtotal * tier.discount;
    const afterDiscount = subtotal - discount;
    const supp = SUPPORT_OPTIONS.find(s => s.id === support);
    const supportCost = afterDiscount * supp.mult;
    const total = afterDiscount + supportCost;
    const cogs = afterDiscount * 0.62;
    const grossMargin = afterDiscount - cogs + (supportCost * 0.55);
    const marginPct = (grossMargin / total) * 100;
    return { perUnit, subtotal, tier, discount, afterDiscount, supportCost, total, grossMargin, marginPct, supp };
  }, [product, productType, qty, cpus, ramGB, storageTB, support]);

  const saveQuote = () => {
    if (!quote || !product) return;
    const name = quoteName.trim() || `${product.name} × ${qty}`;
    const newQuote = {
      id: Date.now(),
      name,
      productName: product.name,
      productType,
      qty,
      total: quote.total,
      marginPct: quote.marginPct,
      tier: quote.tier.label,
      support: quote.supp.label,
      savedAt: new Date().toISOString(),
    };
    const updated = [newQuote, ...savedQuotes].slice(0, 20);
    setSavedQuotes(updated);
    storage.set(LS_KEYS.savedQuotes, updated);
    setQuoteName('');
  };

  const deleteQuote = (id) => {
    const updated = savedQuotes.filter(q => q.id !== id);
    setSavedQuotes(updated);
    storage.set(LS_KEYS.savedQuotes, updated);
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-5">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-60 mb-2">Section A</div>
          <h2 className="display text-3xl font-bold leading-tight">Configure the box.</h2>
          <p className="text-sm opacity-70 mt-1 max-w-lg">Build a quote the way an IPS does: pick a platform, scale the components, watch the volume tier flip, layer services on top.</p>
        </div>

        <div className="flex gap-0 border-2 border-black w-fit">
          {[
            { id: 'compute', label: 'PowerEdge' },
            { id: 'storage', label: 'PowerStore' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setProductType(p.id)}
              className="px-5 py-2.5 mono text-[11px] uppercase tracking-wider transition-all"
              style={{
                background: productType === p.id ? '#0A0A0A' : 'transparent',
                color: productType === p.id ? '#F5F1E8' : '#0A0A0A',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="border-2 border-black p-5" style={{ background: '#FFFEFA' }}>
          <label className="mono text-[10px] uppercase tracking-[0.2em] opacity-60 block mb-2">Model</label>
          {productType === 'compute' ? (
            <select value={serverId} onChange={(e) => setServerId(e.target.value)}
              className="w-full p-3 border-2 border-black bg-transparent text-lg font-semibold display">
              {POWEREDGE.map(s => <option key={s.id} value={s.id}>{s.name} — {s.form}</option>)}
            </select>
          ) : (
            <select value={storageId} onChange={(e) => setStorageId(e.target.value)}
              className="w-full p-3 border-2 border-black bg-transparent text-lg font-semibold display">
              {POWERSTORE.map(s => <option key={s.id} value={s.id}>{s.name} — {s.cores}c / {s.mem}GB</option>)}
            </select>
          )}

          {product && (
            <div className="mt-4 pt-4 border-t border-black/20">
              <div className="text-sm leading-relaxed italic" style={{ color: '#0066CC' }}>
                "{product.pitch}"
              </div>
              {productType === 'compute' && (
                <div className="grid grid-cols-2 gap-3 mt-4 mono text-[11px]">
                  <Spec label="Form" value={product.form} />
                  <Spec label="Sockets" value={product.socket} />
                  <Spec label="Max CPU" value={product.maxCpu} />
                  <Spec label="Max RAM" value={product.maxRam} />
                  <Spec label="Drives" value={product.maxDrives} />
                  <Spec label="Sweet spot" value={product.workloads.slice(0, 2).join(', ')} />
                </div>
              )}
              {productType === 'storage' && (
                <div className="grid grid-cols-2 gap-3 mt-4 mono text-[11px]">
                  <Spec label="CPU cores" value={product.cores} />
                  <Spec label="Memory" value={`${product.mem} GB`} />
                  <Spec label="Max drives" value={product.maxDrives} />
                  <Spec label="Max volumes" value={product.maxVolumes.toLocaleString()} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <NumField label="Quantity" value={qty} onChange={setQty} min={1} max={100} icon={Briefcase} />
          {productType === 'compute' && (
            <>
              <NumField label="CPUs per server" value={cpus} onChange={setCpus} min={1} max={product?.socket || 4} icon={Cpu} />
              <NumField label="RAM (GB) per server" value={ramGB} onChange={setRamGB} min={32} max={16384} step={64} icon={MemoryStick} />
              <NumField label="Storage (TB) per server" value={storageTB} onChange={setStorageTB} min={1} max={500} icon={HardDrive} />
            </>
          )}
          {productType === 'storage' && (
            <NumField label="Usable storage (TB)" value={storageTB} onChange={setStorageTB} min={5} max={4000} step={5} icon={HardDrive} />
          )}
        </div>

        <div>
          <label className="mono text-[10px] uppercase tracking-[0.2em] opacity-60 block mb-2">Services</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SUPPORT_OPTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setSupport(s.id)}
                className="border-2 border-black p-3 text-left transition-all"
                style={{
                  background: support === s.id ? '#0A0A0A' : '#FFFEFA',
                  color: support === s.id ? '#F5F1E8' : '#0A0A0A',
                }}
              >
                <div className="font-semibold text-sm">{s.label}</div>
                <div className="text-[10px] opacity-70 mt-1 leading-tight">{s.desc}</div>
                <div className="mono text-[10px] mt-2">+{(s.mult * 100).toFixed(0)}%</div>
              </button>
            ))}
          </div>
        </div>

        {/* Saved quotes panel */}
        <div className="border-2 border-black" style={{ background: '#FFFEFA' }}>
          <div className="px-5 py-3 border-b-2 border-black flex justify-between items-center">
            <div className="mono text-[10px] uppercase tracking-[0.2em]">Saved quotes · {savedQuotes.length}</div>
            <div className="mono text-[9px] uppercase tracking-[0.2em] opacity-60">{storage.available ? 'Persisted locally' : 'Session only'}</div>
          </div>
          <div className="p-4 flex gap-2 flex-wrap">
            <input
              value={quoteName}
              onChange={(e) => setQuoteName(e.target.value)}
              placeholder={product ? `${product.name} × ${qty}` : 'Quote name'}
              className="flex-1 min-w-[180px] p-2 border-2 border-black bg-transparent text-sm"
            />
            <button onClick={saveQuote} className="mono text-[11px] uppercase tracking-wider px-4 py-2 flex items-center gap-1.5"
              style={{ background: '#0A0A0A', color: '#F5F1E8' }}>
              <Save className="w-3 h-3" /> Save quote
            </button>
          </div>
          {savedQuotes.length > 0 && (
            <div className="px-4 pb-4 space-y-2 max-h-[280px] overflow-y-auto">
              {savedQuotes.map(q => (
                <div key={q.id} className="border border-black/30 p-3 flex items-center justify-between gap-3 hover:bg-black/5 transition">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{q.name}</div>
                    <div className="mono text-[10px] opacity-60 mt-0.5">
                      {q.productName} · {q.tier} · {q.support} · {new Date(q.savedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mono text-sm font-bold number-tick">${q.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="mono text-[10px]" style={{ color: q.marginPct > 30 ? '#0A8754' : '#C8412B' }}>{q.marginPct.toFixed(1)}% GM</div>
                  </div>
                  <button onClick={() => deleteQuote(q.id)} className="opacity-40 hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quote sidebar */}
      <div className="lg:col-span-2">
        <div className="sticky top-6 border-2 border-black" style={{ background: '#0A0A0A', color: '#F5F1E8' }}>
          <div className="px-5 pt-5 pb-3 border-b border-white/20">
            <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-60">Estimated pricing</div>
            <div className="display text-2xl font-bold mt-1">Working quote</div>
          </div>

          {quote && (
            <div className="p-5 space-y-3">
              <Line label="Per-unit list" value={quote.perUnit} />
              <Line label={`× Quantity (${qty})`} value={quote.subtotal} />

              <div className="py-2 border-y border-white/20 my-2">
                <div className="flex justify-between items-center">
                  <span className="mono text-[10px] uppercase tracking-wider opacity-70">Volume tier</span>
                  <span className="mono text-[11px]" style={{ color: '#FFB800' }}>{quote.tier.label}</span>
                </div>
                <Line label={`Discount (${(quote.tier.discount * 100).toFixed(0)}%)`} value={-quote.discount} highlight />
              </div>

              <Line label="Net hardware" value={quote.afterDiscount} bold />
              <Line label={`Support: ${quote.supp.label} (${quote.supp.years}yr)`} value={quote.supportCost} />

              <div className="pt-4 mt-4 border-t-2 border-white/40">
                <div className="flex justify-between items-baseline">
                  <span className="mono text-[10px] uppercase tracking-wider">Total deal</span>
                  <span className="display text-3xl font-extrabold number-tick" style={{ color: '#FFB800' }}>
                    ${quote.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/20">
                <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-60 mb-2">Internals (your view)</div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-80">Est. gross margin</span>
                  <span className="number-tick font-semibold">${quote.grossMargin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="opacity-80">Margin %</span>
                  <span className="number-tick font-semibold" style={{ color: quote.marginPct > 30 ? '#7FE57F' : '#FFB800' }}>
                    {quote.marginPct.toFixed(1)}%
                  </span>
                </div>
                <div className="text-[10px] opacity-60 mt-3 italic leading-relaxed">
                  Margin is illustrative — based on typical hardware COGS and services attach. Real deals factor in deal-reg, special pricing, and comp.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <div>
      <div className="opacity-50 text-[9px] uppercase tracking-wider">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function NumField({ label, value, onChange, min = 0, max = 100, step = 1, icon: Icon }) {
  return (
    <div>
      <label className="mono text-[10px] uppercase tracking-[0.2em] opacity-60 mb-2 flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
        className="w-full p-3 border-2 border-black bg-transparent text-lg font-semibold number-tick"
        style={{ background: '#FFFEFA' }}
      />
    </div>
  );
}

function Line({ label, value, bold, highlight }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className={`text-sm ${bold ? 'font-semibold' : 'opacity-80'}`}>{label}</span>
      <span
        className={`mono ${bold ? 'text-base font-bold' : 'text-sm'} number-tick`}
        style={{ color: highlight ? '#7FE57F' : 'inherit' }}
      >
        {value < 0 ? '-' : ''}${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </span>
    </div>
  );
}

// ============ FLASHCARDS (with SM-2 spaced repetition + persistence + keyboard) ============
function Flashcards() {
  const [progress, setProgress] = useState(() => storage.get(LS_KEYS.cardProgress, {}));
  const [filter, setFilter] = useState('All');
  const [flipped, setFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ right: 0, wrong: 0, seen: 0 });
  const [currentCard, setCurrentCard] = useState(null);
  const cardRef = useRef(null);

  // Pick first card on mount or when filter changes
  useEffect(() => {
    const pool = filter === 'All' ? FLASHCARDS : FLASHCARDS.filter(c => c.cat === filter);
    setCurrentCard(selectNextCard(pool, progress));
    setFlipped(false);
  }, [filter]);

  const recordReview = (correct) => {
    if (!currentCard) return;
    const quality = correct ? 5 : 2;
    const cardProg = progress[currentCard.id] || defaultProgress();
    const updated = { ...progress, [currentCard.id]: applyReview(cardProg, quality) };
    setProgress(updated);
    storage.set(LS_KEYS.cardProgress, updated);
    setSessionStats(s => ({
      right: s.right + (correct ? 1 : 0),
      wrong: s.wrong + (correct ? 0 : 1),
      seen: s.seen + 1,
    }));
    setFlipped(false);
    // Pick next from same pool
    const pool = filter === 'All' ? FLASHCARDS : FLASHCARDS.filter(c => c.cat === filter);
    // Use small timeout so user sees the flip-back transition
    setTimeout(() => setCurrentCard(selectNextCard(pool, updated)), 180);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.code === 'Space') { e.preventDefault(); setFlipped(f => !f); }
      else if (e.code === 'ArrowRight' || e.key === '2') { if (flipped) recordReview(true); }
      else if (e.code === 'ArrowLeft' || e.key === '1') { if (flipped) recordReview(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flipped, currentCard, progress, filter]);

  const resetAll = () => {
    if (!window.confirm('Reset all flashcard progress? This cannot be undone.')) return;
    setProgress({});
    storage.set(LS_KEYS.cardProgress, {});
    setSessionStats({ right: 0, wrong: 0, seen: 0 });
    const pool = filter === 'All' ? FLASHCARDS : FLASHCARDS.filter(c => c.cat === filter);
    setCurrentCard(selectNextCard(pool, {}));
  };

  // Insights
  const insights = useMemo(() => {
    const now = Date.now();
    const seenCards = FLASHCARDS.filter(c => progress[c.id]?.totalSeen > 0);
    const dueNow = FLASHCARDS.filter(c => {
      const p = progress[c.id];
      return p && p.totalSeen > 0 && p.due <= now;
    });
    const learned = FLASHCARDS.filter(c => {
      const p = progress[c.id];
      return p && p.reps >= 2;
    });
    // Weakest cats by miss rate
    const catStats = {};
    CATS.forEach(cat => {
      const cards = FLASHCARDS.filter(c => c.cat === cat);
      let totalSeen = 0, totalRight = 0;
      cards.forEach(c => {
        const p = progress[c.id];
        if (p) { totalSeen += p.totalSeen || 0; totalRight += p.totalRight || 0; }
      });
      if (totalSeen > 0) catStats[cat] = { acc: (totalRight / totalSeen) * 100, seen: totalSeen };
    });
    const weakestCat = Object.entries(catStats).sort((a, b) => a[1].acc - b[1].acc)[0];
    return {
      seen: seenCards.length,
      total: FLASHCARDS.length,
      dueNow: dueNow.length,
      learned: learned.length,
      weakestCat: weakestCat ? { name: weakestCat[0], acc: weakestCat[1].acc } : null,
      catStats,
    };
  }, [progress]);

  if (!currentCard) return null;

  const sessionAcc = sessionStats.seen > 0 ? Math.round((sessionStats.right / sessionStats.seen) * 100) : 0;
  const cardProg = progress[currentCard.id];

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-5">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-60 mb-2">Section B · Spaced Repetition</div>
            <h2 className="display text-3xl font-bold leading-tight">Drill the talk track.</h2>
            <p className="text-sm opacity-70 mt-1 max-w-lg">Cards you miss come back sooner. Cards you nail get spaced out. The algorithm decides what you see next.</p>
          </div>
          <button onClick={resetAll} className="mono text-[10px] uppercase tracking-wider px-3 py-2 border-2 border-black flex items-center gap-1.5 opacity-60 hover:opacity-100">
            <RefreshCw className="w-3 h-3" /> Reset progress
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['All', ...CATS].map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className="mono text-[10px] uppercase tracking-wider px-3 py-1.5 border-2 border-black transition-all"
              style={{
                background: filter === c ? '#0A0A0A' : 'transparent',
                color: filter === c ? '#F5F1E8' : '#0A0A0A',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div
          ref={cardRef}
          className="border-2 border-black min-h-[340px] cursor-pointer relative overflow-hidden select-none"
          onClick={() => setFlipped(f => !f)}
          style={{ background: flipped ? '#0066CC' : '#FFFEFA', color: flipped ? '#FFFEFA' : '#0A0A0A', transition: 'background 0.4s' }}
        >
          <div className="absolute top-3 left-4 mono text-[10px] uppercase tracking-[0.2em] opacity-60">
            {currentCard.cat}
            {cardProg && cardProg.totalSeen > 0 && (
              <span className="ml-3 opacity-80">
                seen {cardProg.totalSeen}× · ef {cardProg.ef.toFixed(2)}
              </span>
            )}
            {(!cardProg || cardProg.totalSeen === 0) && (
              <span className="ml-3" style={{ color: flipped ? '#FFB800' : '#0066CC' }}>NEW</span>
            )}
          </div>
          <div className="absolute bottom-3 right-4 mono text-[10px] uppercase tracking-[0.2em] opacity-60">
            Space / click to {flipped ? 'hide' : 'reveal'}
          </div>

          <div className="p-8 md:p-10 flex items-center min-h-[340px]">
            {!flipped ? (
              <div>
                <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-60 mb-3">Customer asks</div>
                <div className="display text-2xl md:text-3xl font-semibold leading-tight">{currentCard.q}</div>
              </div>
            ) : (
              <div>
                <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-80 mb-3">Your answer</div>
                <div className="text-lg leading-relaxed">{currentCard.a}</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => recordReview(false)}
            disabled={!flipped}
            className="flex-1 border-2 border-black py-3 px-4 mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-[#F5F1E8] disabled:hover:bg-transparent disabled:hover:text-black"
          >
            <X className="w-4 h-4" /> Missed it <span className="opacity-50 ml-2 text-[9px]">[←]</span>
          </button>
          <button
            onClick={() => recordReview(true)}
            disabled={!flipped}
            className="flex-1 py-3 px-4 mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: flipped ? '#0A0A0A' : 'transparent', color: flipped ? '#F5F1E8' : '#0A0A0A', border: '2px solid #0A0A0A' }}
          >
            <Check className="w-4 h-4" /> Got it <span className="opacity-50 ml-2 text-[9px]">[→]</span>
          </button>
        </div>

        {!flipped && (
          <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-50 text-center">
            Reveal the answer before grading yourself
          </div>
        )}
      </div>

      {/* Insights sidebar */}
      <div className="lg:col-span-2">
        <div className="sticky top-6 space-y-4">
          <div className="border-2 border-black p-5" style={{ background: '#FFFEFA' }}>
            <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-60 mb-4 flex items-center gap-1.5">
              <Target className="w-3 h-3" /> All-time progress
            </div>
            <div className="grid grid-cols-2 gap-3">
              <BigStat label="Deck mastery" value={`${Math.round((insights.learned / insights.total) * 100)}%`} sub={`${insights.learned} of ${insights.total}`} />
              <BigStat label="Cards introduced" value={`${insights.seen}`} sub={`of ${insights.total}`} />
              <BigStat label="Due now" value={insights.dueNow} sub={insights.dueNow > 0 ? 'review them' : 'all caught up'} color={insights.dueNow > 0 ? '#C8412B' : '#0A8754'} />
              <BigStat label="This session" value={`${sessionAcc}%`} sub={`${sessionStats.seen} cards seen`} />
            </div>
          </div>

          {insights.weakestCat && (
            <div className="border-2 border-black p-5" style={{ background: '#0A0A0A', color: '#F5F1E8' }}>
              <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-60 mb-2 flex items-center gap-1.5">
                <Flame className="w-3 h-3" style={{ color: '#FFB800' }} /> Weakest category
              </div>
              <div className="display text-xl font-bold mt-1">{insights.weakestCat.name}</div>
              <div className="mono text-sm opacity-80 mt-1">{insights.weakestCat.acc.toFixed(0)}% accuracy</div>
              <button
                onClick={() => setFilter(insights.weakestCat.name)}
                className="mt-3 text-[11px] mono uppercase tracking-wider underline opacity-90 hover:opacity-100"
              >
                Filter to this category →
              </button>
            </div>
          )}

          <div className="border-2 border-black p-5" style={{ background: '#FFFEFA' }}>
            <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-60 mb-2">How it works</div>
            <p className="text-xs leading-relaxed opacity-80">
              Modified SM-2: nail a card and it gets pushed further out (1 day → 3 → 7 → 18...). Miss it and it comes back this session. The harder it is for you, the more you'll see it.
            </p>
            <div className="mt-3 mono text-[10px] uppercase tracking-[0.2em] opacity-60">Keyboard</div>
            <div className="mono text-xs opacity-80 mt-1 space-y-0.5">
              <div>SPACE — flip card</div>
              <div>← / 1 — missed it</div>
              <div>→ / 2 — got it</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BigStat({ label, value, sub, color }) {
  return (
    <div>
      <div className="mono text-[9px] uppercase tracking-wider opacity-60">{label}</div>
      <div className="display text-3xl font-extrabold number-tick mt-1" style={{ color: color || '#0A0A0A' }}>{value}</div>
      {sub && <div className="mono text-[10px] opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
}

// ============ DISCOVERY ============
function Discovery() {
  const [industry, setIndustry] = useState('Financial Services');
  const [size, setSize] = useState('Mid-market (500-5000)');
  const [pain, setPain] = useState('AI/ML adoption');
  const [generated, setGenerated] = useState(false);

  const questions = useMemo(() => {
    return [
      ...QUESTION_BANK.base,
      ...(QUESTION_BANK.industry[industry] || []),
      ...(QUESTION_BANK.pain[pain] || []),
    ];
  }, [industry, pain]);

  const recommendations = RECOMMEND_MAP[pain] || [];

  const typeColor = {
    'Situation': '#0066CC',
    'Problem': '#C8412B',
    'Implication': '#7C3FBA',
    'Need-Payoff': '#0A8754',
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-60 mb-2">Section C</div>
        <h2 className="display text-3xl font-bold leading-tight">Walk in with a plan.</h2>
        <p className="text-sm opacity-70 mt-1 max-w-2xl">Tell me the customer. I'll give you the SPIN-style questions you should be asking and the Dell stack most likely to fit. Use it as a pre-call checklist, not a script.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 border-2 border-black p-5" style={{ background: '#FFFEFA' }}>
        <div>
          <label className="mono text-[10px] uppercase tracking-[0.2em] opacity-60 mb-2 flex items-center gap-1.5">
            <Building2 className="w-3 h-3" /> Industry
          </label>
          <select value={industry} onChange={(e) => { setIndustry(e.target.value); setGenerated(false); }}
            className="w-full p-3 border-2 border-black bg-transparent font-semibold">
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="mono text-[10px] uppercase tracking-[0.2em] opacity-60 mb-2 flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Size
          </label>
          <select value={size} onChange={(e) => { setSize(e.target.value); setGenerated(false); }}
            className="w-full p-3 border-2 border-black bg-transparent font-semibold">
            {SIZES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="mono text-[10px] uppercase tracking-[0.2em] opacity-60 mb-2 flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Primary pain
          </label>
          <select value={pain} onChange={(e) => { setPain(e.target.value); setGenerated(false); }}
            className="w-full p-3 border-2 border-black bg-transparent font-semibold">
            {PAINS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="md:col-span-3">
          <button
            onClick={() => setGenerated(true)}
            className="w-full md:w-auto py-3 px-6 mono text-[11px] uppercase tracking-wider flex items-center gap-2"
            style={{ background: '#0A0A0A', color: '#F5F1E8' }}
          >
            Generate call prep <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {generated && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-3">
            <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-60 mb-1">
              {questions.length} discovery questions · {industry} · {pain}
            </div>
            {questions.map((q, i) => (
              <div key={i} className="border-2 border-black flex" style={{ background: '#FFFEFA' }}>
                <div
                  className="mono text-[10px] uppercase tracking-wider px-3 py-4 flex items-center justify-center text-white text-center"
                  style={{ background: typeColor[q.type], width: '90px', minWidth: '90px' }}
                >
                  {q.type}
                </div>
                <div className="p-4 flex-1 flex items-center">
                  <div className="text-sm md:text-base leading-relaxed">{q.q}</div>
                </div>
                <div className="mono text-2xl opacity-20 px-4 flex items-center display font-bold">
                  {String(i + 1).padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-6 space-y-4">
              <div className="border-2 border-black p-5" style={{ background: '#0A0A0A', color: '#F5F1E8' }}>
                <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-60 mb-3">Likely fit · prep the demo</div>
                <div className="space-y-2">
                  {recommendations.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 py-2 border-b border-white/10 last:border-0">
                      <ChevronRight className="w-4 h-4" style={{ color: '#FFB800' }} />
                      <span className="text-sm font-semibold">{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-2 border-black p-5" style={{ background: '#FFFEFA' }}>
                <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-60 mb-2 flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> Reminder
                </div>
                <p className="text-sm leading-relaxed">
                  Don't fire all of these. Pick 4-6, listen for what they don't answer, follow the thread. Discovery is a conversation, not a survey.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
