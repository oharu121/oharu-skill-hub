export type Category = 'aws' | 'workflow' | 'gem';
export type Locale = 'en' | 'ja';
export type Status = 'stable' | 'beta';

export type SkillEntry = {
	slug: string;
	category: Category;
	status: Status;
	install?: {
		gh: string;
		npx: string;
		pnpm: string;
	};
	related: string[];
	github: string;
	// oharu121/skills commit this page was last checked against. See scripts/check-sync.ts.
	syncedAt: string;
	i18n: Record<Locale, { title: string; tagline: string }>;
};

export const repo = 'oharu121/skills';
export const blobBase = `https://github.com/${repo}/blob/main/`;
const gh = (name: string) => `gh skill install ${repo} ${name}`;
const npx = (name: string) => `npx skills add ${repo}/${name}`;
const pnpm = (name: string) => `pnpm dlx skills add ${repo}/${name}`;
const src = (path: string) => `${blobBase}${path}`;

export const skills: SkillEntry[] = [
	{
		slug: 'aws-architecture-diagram',
		category: 'aws',
		status: 'stable',
		install: {
			gh: gh('aws-architecture-diagram'),
			npx: npx('aws-architecture-diagram'),
			pnpm: pnpm('aws-architecture-diagram'),
		},
		related: ['aws-cost-estimate', 'bedrock-ops'],
		github: src('skills/aws-architecture-diagram'),
		syncedAt: 'e86556458b7d9ae5b6cda23a48d5404e90009056',
		i18n: {
			en: {
				title: 'aws-architecture-diagram',
				tagline: 'Generate Draw.io architecture diagrams with accurate AWS service icons.',
			},
			ja: {
				title: 'aws-architecture-diagram',
				tagline: '正確な AWS サービスアイコンで Draw.io アーキテクチャ図を生成します。',
			},
		},
	},
	{
		slug: 'aws-cost-estimate',
		category: 'aws',
		status: 'stable',
		install: {
			gh: gh('aws-cost-estimate'),
			npx: npx('aws-cost-estimate'),
			pnpm: pnpm('aws-cost-estimate'),
		},
		related: ['aws-architecture-diagram', 'bedrock-ops'],
		github: src('skills/aws-cost-estimate'),
		syncedAt: '960aa24b9b829526fb980daba8f28726de0d5f9b',
		i18n: {
			en: {
				title: 'aws-cost-estimate',
				tagline: 'Produce AWS cost estimates from architecture documents via the Price List API.',
			},
			ja: {
				title: 'aws-cost-estimate',
				tagline: 'Price List API を使ってアーキテクチャ資料から AWS コスト見積もりを作成します。',
			},
		},
	},
	{
		slug: 'bedrock-ops',
		category: 'aws',
		status: 'stable',
		install: {
			gh: gh('bedrock-ops'),
			npx: npx('bedrock-ops'),
			pnpm: pnpm('bedrock-ops'),
		},
		related: ['aws-architecture-diagram', 'migrate-env-to-1password'],
		github: src('skills/bedrock-ops'),
		syncedAt: '960aa24b9b829526fb980daba8f28726de0d5f9b',
		i18n: {
			en: {
				title: 'bedrock-ops',
				tagline: 'Operate the Bedrock Knowledge Base + S3 pipeline with safety rails and cost guards.',
			},
			ja: {
				title: 'bedrock-ops',
				tagline: 'セーフティガードとコスト監視つきで Bedrock ナレッジベース + S3 パイプラインを運用します。',
			},
		},
	},
	{
		slug: 'release',
		category: 'workflow',
		status: 'stable',
		install: {
			gh: gh('release'),
			npx: npx('release'),
			pnpm: pnpm('release'),
		},
		related: ['devio', 'generate-bruno-files'],
		github: src('skills/release'),
		syncedAt: '960aa24b9b829526fb980daba8f28726de0d5f9b',
		i18n: {
			en: {
				title: 'release',
				tagline: 'End-to-end release automation: repo detection, pre-flight checks, issue, commit, tag, push.',
			},
			ja: {
				title: 'release',
				tagline: 'リポジトリ判定・プリフライト・Issue 作成・コミット・タグ・プッシュまで一気通貫でリリースを自動化します。',
			},
		},
	},
	{
		slug: 'migrate-env-to-1password',
		category: 'workflow',
		status: 'stable',
		install: {
			gh: gh('migrate-env-to-1password'),
			npx: npx('migrate-env-to-1password'),
			pnpm: pnpm('migrate-env-to-1password'),
		},
		related: ['bedrock-ops', 'release'],
		github: src('skills/migrate-env-to-1password'),
		syncedAt: '960aa24b9b829526fb980daba8f28726de0d5f9b',
		i18n: {
			en: {
				title: 'migrate-env-to-1password',
				tagline: 'Interactively migrate .env secrets to 1Password, replacing values with op:// references.',
			},
			ja: {
				title: 'migrate-env-to-1password',
				tagline: '.env の秘密情報を 1Password に対話的に移行し、値を op:// 参照に置き換えます。',
			},
		},
	},
	{
		slug: 'generate-bruno-files',
		category: 'workflow',
		status: 'stable',
		install: {
			gh: gh('generate-bruno-files'),
			npx: npx('generate-bruno-files'),
			pnpm: pnpm('generate-bruno-files'),
		},
		related: ['devio', 'release'],
		github: src('skills/generate-bruno-files'),
		syncedAt: '960aa24b9b829526fb980daba8f28726de0d5f9b',
		i18n: {
			en: {
				title: 'generate-bruno-files',
				tagline: 'Extract HTTP requests from source code and emit Bruno .bru files.',
			},
			ja: {
				title: 'generate-bruno-files',
				tagline: 'ソースコードから HTTP リクエストを抽出し Bruno の .bru ファイルを生成します。',
			},
		},
	},
	{
		slug: 'logo',
		category: 'workflow',
		status: 'stable',
		install: {
			gh: gh('logo'),
			npx: npx('logo'),
			pnpm: pnpm('logo'),
		},
		related: ['thumbnail-generator', 'release'],
		github: src('skills/logo'),
		syncedAt: '960aa24b9b829526fb980daba8f28726de0d5f9b',
		i18n: {
			en: {
				title: 'logo',
				tagline:
					'Design a mark through reference study, concept rounds, and a contact sheet that renders every candidate at 16px.',
			},
			ja: {
				title: 'logo',
				tagline:
					'リファレンス調査・コンセプトのラウンド生成・全候補を 16px でも描画するコンタクトシートでロゴを設計します。',
			},
		},
	},
	{
		slug: 'devio',
		category: 'workflow',
		status: 'stable',
		install: {
			gh: gh('devio'),
			npx: npx('devio'),
			pnpm: pnpm('devio'),
		},
		related: ['generate-bruno-files', 'release'],
		github: src('skills/devio'),
		syncedAt: '960aa24b9b829526fb980daba8f28726de0d5f9b',
		i18n: {
			en: {
				title: 'devio',
				tagline: 'Draft and publish DevelopersIO articles with tag search, Contentful publish, and Japanese translation.',
			},
			ja: {
				title: 'devio',
				tagline: 'タグ検索、Contentful 公開、日本語翻訳まで対応した DevelopersIO 記事の執筆・公開ワークフロー。',
			},
		},
	},
	{
		slug: 'daily-briefing',
		category: 'gem',
		status: 'stable',
		related: ['jp-communication-enhancer', 'thumbnail-generator'],
		github: src('gems/daily-briefing.md'),
		syncedAt: '960aa24b9b829526fb980daba8f28726de0d5f9b',
		i18n: {
			en: {
				title: 'daily-briefing',
				tagline: 'Morning briefing that pulls Google Calendar events and priority Gmail into a single digest.',
			},
			ja: {
				title: 'daily-briefing',
				tagline: 'Google カレンダーの予定と優先度の高いメールを朝のダイジェストにまとめます。',
			},
		},
	},
	{
		slug: 'jp-communication-enhancer',
		category: 'gem',
		status: 'stable',
		related: ['daily-briefing', 'thumbnail-generator'],
		github: src('gems/jp-communication-enhancer.md'),
		syncedAt: '960aa24b9b829526fb980daba8f28726de0d5f9b',
		i18n: {
			en: {
				title: 'jp-communication-enhancer',
				tagline: 'Transform English drafts into three levels of Japanese business communication.',
			},
			ja: {
				title: 'jp-communication-enhancer',
				tagline: '英語のドラフトをビジネス日本語の 3 段階（Slack・メール・フォーマル）に整えます。',
			},
		},
	},
	{
		slug: 'thumbnail-generator',
		category: 'gem',
		status: 'stable',
		related: ['daily-briefing', 'jp-communication-enhancer'],
		github: src('gems/thumbnail-generator.md'),
		syncedAt: '960aa24b9b829526fb980daba8f28726de0d5f9b',
		i18n: {
			en: {
				title: 'thumbnail-generator',
				tagline: 'Generate thumbnail variations for tech articles using visual metaphors.',
			},
			ja: {
				title: 'thumbnail-generator',
				tagline: 'テック記事向けに視覚的メタファーを使ったサムネイルのバリエーションを生成します。',
			},
		},
	},
];

export function getSkill(slug: string): SkillEntry | undefined {
	return skills.find((s) => s.slug === slug);
}

export function getSkillsByCategory(category: Category): SkillEntry[] {
	return skills.filter((s) => s.category === category);
}

export function resolveLocale(currentLocale: string | undefined): Locale {
	return currentLocale === 'ja' ? 'ja' : 'en';
}
