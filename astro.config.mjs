// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://skills.oharu121.com',
	integrations: [
		starlight({
			title: {
				en: 'Oharu Skill Hub',
				ja: 'Oharu スキルハブ',
			},
			description: 'Documentation for custom Claude Code skills and Gemini gems by oharu121.',
			defaultLocale: 'root',
			locales: {
				root: { label: 'English', lang: 'en' },
				ja: { label: '日本語', lang: 'ja' },
			},
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/oharu121/skills',
				},
			],
			sidebar: [
				{
					label: 'Start here',
					translations: { ja: 'はじめに' },
					items: [
						{ slug: 'start/welcome', translations: { ja: 'ようこそ' } },
						{ slug: 'start/installing', translations: { ja: 'スキルのインストール' } },
						{ slug: 'start/gems', translations: { ja: 'Gemini ジェムの使い方' } },
						{ slug: 'start/conventions', translations: { ja: '共通ルール' } },
					],
				},
				{
					label: 'Skills',
					translations: { ja: 'スキル' },
					items: [
						{ slug: 'skills', label: 'Overview', translations: { ja: '一覧' } },
						{
							label: 'AWS',
							translations: { ja: 'AWS' },
							items: [
								{
									label: 'aws-architecture-diagram',
									items: [
										{ slug: 'skills/aws-architecture-diagram', label: 'Guide', translations: { ja: 'ガイド' } },
										{ slug: 'skills/aws-architecture-diagram/reference', label: 'Reference', translations: { ja: 'リファレンス' } },
									],
								},
								{ slug: 'skills/aws-cost-estimate' },
								{ slug: 'skills/bedrock-ops' },
							],
						},
						{
							label: 'Workflows',
							translations: { ja: 'ワークフロー' },
							items: [
								{
									label: 'release',
									items: [
										{ slug: 'skills/release', label: 'Guide', translations: { ja: 'ガイド' } },
										{ slug: 'skills/release/reference', label: 'Reference', translations: { ja: 'リファレンス' } },
									],
								},
								{
									label: 'logo',
									items: [
										{ slug: 'skills/logo', label: 'Guide', translations: { ja: 'ガイド' } },
										{ slug: 'skills/logo/reference', label: 'Reference', translations: { ja: 'リファレンス' } },
									],
								},
								{ slug: 'skills/migrate-env-to-1password' },
								{ slug: 'skills/generate-bruno-files' },
								{ slug: 'skills/devio' },
							],
						},
					],
				},
				{
					label: 'Gems',
					translations: { ja: 'ジェム' },
					items: [
						{ slug: 'gems', label: 'Overview', translations: { ja: '一覧' } },
						{ slug: 'gems/daily-briefing' },
						{ slug: 'gems/jp-communication-enhancer' },
						{ slug: 'gems/thumbnail-generator' },
					],
				},
			],
		}),
	],
});
