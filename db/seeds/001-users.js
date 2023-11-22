/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del()
  await knex('users').insert([
    {username: 'admin', password:"admin"},
    {username: 'tatsu', password:"tatsu"},
    {username: 'taro', password:"taro"},
    {username: 'jiro', password:"jiro"},
    {username: 'sabro', password:"sabro"},
  ]);
};
