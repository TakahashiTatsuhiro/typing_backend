import dotenv from 'dotenv';
dotenv.config({ path: './.env' }); //相対パスの起点はこのファイルがある階層ではなくアプリを起動する階層なので、この指示が正しい。

import fs from 'fs';
import express from 'express';
import { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cors from 'cors';
import Knex from 'knex';
import knexfile from '../knexfile';
import { User } from '../globals';

//express設定-------------------------------------------------------------
const app = express();
const port = 3001; //vite側を3000にするため

declare module 'express-session' {
	interface SessionData {
		user?: {
			id: number;
			username: string;
			password: string;
		};
	}
}

app.use(cors()); // CORS（Cross-Origin Resource Sharing）の設定
app.use(express.json()); // JSONリクエストボディの解析
app.use(
	session({
		secret: process.env.SESSTION_SECRET || 'secret_key_wo_ireyou',
		resave: false,
		saveUninitialized: true,
		cookie: { secure: process.env.NODE_ENV === 'production' }, // 開発環境と本番環境で切り替える
	})
);

// ヘルパー & ミドルウェア----------------------------------------------------
function checkAuthenticated(req: Request, res: Response, next: NextFunction) {
	if (req.session && req.session.user) {
		return next();
	}
	res.status(401).json({ success: false, message: '未認証のアクセスです' });
}

//https://zenn.dev/k_kazukiiiiii/articles/cf3256ef6cbd84
const shuffleArray = (array: string[]) => {
	const cloneArray = [...array];

	for (let i = cloneArray.length - 1; i >= 0; i--) {
		let rand = Math.floor(Math.random() * (i + 1));
		// 配列の要素の順番を入れ替える
		let tmpStorage = cloneArray[i];
		cloneArray[i] = cloneArray[rand];
		cloneArray[rand] = tmpStorage;
	}

	return cloneArray;
};

// Knexインスタンスの初期化--------------------------------------------------
// 環境に応じたKnex設定の選択
const knexConfig = knexfile[process.env.NODE_ENV || 'development'];
const knex = Knex(knexConfig);

//ルート-------------------------------------------------------------------
app.get('/', (req, res) => {
	res.send('こちらはbackend側だよ');
});

//ログイン認証---------------------------------------------------------------
app.post('/login', async (req, res) => {
	const { username, password } = req.body;
	try {
		const user: User = await knex('users').where({ username }).first();
		if (user && user.password === password) {
			// ユーザー情報をセッションに格納
			req.session.user = user;
			res.json({
				success: true,
				user: { username: user.username, id: user.id },
				message: 'ログイン成功',
			});
		} else {
			res.status(401).json({ success: false, message: 'ログイン失敗' });
		}
	} catch (error) {
		console.log('error', error);
		res.status(500).json({ success: false, message: 'サーバーエラー' });
	}
});

//新規メンバー登録------------------------------------------------------------------
app.post('/signup', async (req, res) => {
	const { username, password } = req.body;

	try {
		// ユーザー名の重複チェック
		const existingUser = await knex('users').where({ username }).first();
		if (existingUser) {
			return res.status(409).json({ success: false, message: 'ユーザー名が既に存在します' });
		}

		// 新規ユーザーの追加
		const newUser: User[] = await knex('users').insert({ username, password }).returning('*');
		res.json({
			success: true,
			user: { id: newUser[0].id, username: newUser[0].username },
			message: '新規登録成功',
		});
	} catch (error) {
		res.status(500).json({ success: false, message: 'サーバーエラー' });
	}
});

//ログアウト-----------------------------------------------------------------
app.post('/logout', (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			return res.status(500).json({ success: false, message: 'ログアウトに失敗しました' });
		}
		res.json({ success: true, message: 'ログアウト成功' });
	});
});

//単語データ取得-------------------------------------------------------------
app.get('/words', (req, res) => {
	const words: string[] = [];
	const data = fs.readFileSync('./src/NGSL_1.2_stats.csv', 'utf-8');
	let indexDatasArr = data.split('\n');
	for (let i = 0; i < indexDatasArr.length; i++) {
		words.push(indexDatasArr[i].split(',')[0]);
	}

	res.status(200).json(shuffleArray(words).slice(0, 200));
});

//タイピング結果登録-----------------------------------------------------------
app.post('/result', async (req, res) => {
	const { id, wpm } = req.body; // ユーザーIDとタイピングスピード（WPM）
	try {
		// results テーブルに新しい結果を挿入
		await knex('results').insert({
			user_id: id,
			date: new Date(), // 現在の日付と時刻
			score: wpm,
		});

		res.status(200).json({ success: true, message: '結果が保存されました' });
	} catch (error) {
		console.log('error', error);
		res.status(500).json({ success: false, message: 'サーバーエラー' });
	}
});

//タイピング結果出力-----------------------------------------------------------
app.get('/scores', async (req, res) => {
	try {
		const scores = await knex('results')
			.join('users', 'users.id', '=', 'results.user_id')
			.select('users.id as user_id', 'users.username', 'results.date', 'results.score');
		res.status(200).json({ success: true, scores, message: '正常に完了' });
	} catch (error) {
		console.log('error', error);
		res.status(500).json({ success: false, message: 'サーバーエラー' });
	}
});

//リッスン--------------------------------------------------------------------
app.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
});
