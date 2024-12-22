import type { Connection } from "mysql";
import "./env.js";
import fs from "node:fs";
import prompts from "prompts";
import crypto from "node:crypto";
import { close, connect, query } from "./sql.js";

async function iniTables(con: Connection) {
  const tables = await fs.promises.readFile("./tables.sql");
  await query(con, tables.toString());
}

async function operation(): Promise<number> {
  console.log("0. Exit");
  console.log("1. Create");
  console.log("2. Read");
  console.log("3. Update");
  console.log("4. Delete");
  const result = await prompts({
    type: "number",
    name: "choice",
    message: "Select an operation: ",
    validate: (value: number) =>
      value < 0 || value > 4 ? `Invalid choice` : true,
  });
  return result.choice;
}

async function create(con: Connection) {
  const result = await prompts([
    {
      type: "text",
      name: "username",
      message: "Enter username: ",
      validate: (username: string) =>
        username.trim().length === 0 ? `Invalid username` : true,
    },
    {
      type: "text",
      name: "email",
      message: "Enter email: ",
      validate: (email: string) =>
        email.trim().length === 0 ? `Invalid email` : true,
    },
    {
      type: "password",
      name: "password",
      message: "Enter password: ",
      validate: (password: string) =>
        password.trim().length === 0 ? `Invalid password` : true,
    },
  ]);

  const hash = crypto.createHash("sha256", result.password);
  const hashedPassword = hash.update(result.password).digest("hex");

  await query(con, {
    sql: "INSERT INTO users (username, email, password) VALUES ?",
    values: [[[result.username, result.email, hashedPassword]]],
  });
}

async function read(con: Connection) {
  console.log("1. All");
  console.log("2. Search");
  const result = await prompts({
    type: "number",
    name: "method",
    message: "Select method: ",
    validate: (value: number) =>
      value < 1 || value > 2 ? `Invalid choice` : true,
  });

  if (result.method === 1) {
    const users = await query(con, "SELECT * FROM users");
    console.table(users);
    return;
  }

  const search = await prompts({
    type: "text",
    name: "email",
    message: "Enter search (email): ",
    validate: (value: string) =>
      value.trim().length === 0 ? `Invalid search` : true,
  });
  const user = await query(con, {
    sql: "SELECT * FROM users WHERE email = ?",
    values: [search.email],
  });
  console.table(user);
}

async function update(con: Connection) {
  const result = await prompts([
    {
      type: "text",
      name: "email",
      message: "Search by email: ",
      validate: (email: string) =>
        email.trim().length === 0 ? `Invalid email` : true,
    },
    {
      type: "text",
      name: "username",
      message: "New username: ",
      validate: (username: string) =>
        username.trim().length === 0 ? `Invalid username` : true,
    },
  ]);

  await query(con, {
    sql: "UPDATE users SET username = ? WHERE email = ?",
    values: [result.username, result.email],
  });
}

async function remove(con: Connection) {
  const result = await prompts({
    type: "text",
    name: "email",
    message: "Enter email: ",
    validate: (email: string) =>
      email.trim().length === 0 ? `Invalid email` : true,
  });
  await query(con, {
    sql: "DELETE FROM users WHERE email = ?",
    values: [result.email],
  });
}

async function main() {
  const con = await connect({
    host: "localhost",
    user: "root",
    password: "",
    database: "node",
  });
  await iniTables(con);

  while (true) {
    const choice = await operation();
    if (choice === 0) break;

    switch (choice) {
      case 1:
        await create(con);
        break;
      case 2:
        await read(con);
        break;
      case 3:
        await update(con);
        break;
      case 4:
        await remove(con);
        break;
    }
  }

  await close(con);
}

main();
