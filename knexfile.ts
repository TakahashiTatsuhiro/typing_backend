import dotenv from 'dotenv';
dotenv.config({ path: './.env' }); //相対パスの起点はこのファイルがある階層ではなくアプリを起動する階層なので、この指示が正しい。

import { Knex } from 'knex';

interface KnexConfig {
	[key: string]: Knex.Config;
}
const config: KnexConfig = {
	development: {
		client: 'pg',
		connection: {
			host: process.env.DB_HOST || '127.0.0.1',
			port: parseInt(process.env.DB_PORT || '5432'),
			database: process.env.DB_NAME,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
		},
		migrations: {
			directory: './db/migrations',
		},
		seeds: {
			directory: './db/seeds',
		},
	},
};

export default config;
