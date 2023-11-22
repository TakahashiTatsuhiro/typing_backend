import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex('users').del()
    await knex("results").del();
    await knex('users').insert([
      {username: 'admin', password:"admin"},
      {username: 'tatsu', password:"tatsu"},
      {username: 'taro', password:"taro"},
      {username: 'jiro', password:"jiro"},
      {username: 'sabro', password:"sabro"},
    ]);
};
