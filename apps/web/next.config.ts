/** @type {import('next').NextConfig} */
import { NextConfig } from 'next';
import webpack from 'webpack';

const nextConfig: NextConfig = {
	reactStrictMode: false,
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{ key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
					{ key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
				],
			},
		];
	},
	webpack(config, { isServer }) {
		config.experiments = { ...config.experiments, topLevelAwait: true };
		config.resolve.fallback = {
			fs: false,
			tls: false,
			net: false,
			path: false,
			zlib: false,
			http: false,
			https: false,
			stream: false,
			crypto: false,
			worker_threads: false,
			dns: false,
			child_process: false,
		};

		config.plugins.push(
			new webpack.NormalModuleReplacementPlugin(/^node:/, resource => {
				resource.request = resource.request.replace(/^node:/, '');
			})
		);

		if (isServer) {
			config.externals.push('o1js');
		}

		return config;
	},
	compress: false,
	output: 'standalone',
};

export default nextConfig;
