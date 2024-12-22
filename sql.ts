import mysql from "mysql";

export async function connect(
  config: mysql.ConnectionConfig
): Promise<mysql.Connection> {
  const con = mysql.createConnection({ ...config, debug: global.isDev });
  return new Promise((resolve, reject) => {
    con.connect((err) => {
      if (err) return reject(err);
      return resolve(con);
    });
  });
}

export async function close(con: mysql.Connection): Promise<void> {
  return new Promise((resolve, reject) => {
    con.end((err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
}

export async function query(
  con: mysql.Connection,
  option: string | mysql.QueryOptions
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    con.beginTransaction((err) => {
      if (err) return reject(err);

      con.query(option, (err, result, fields) => {
        if (err) {
          return con.rollback(() => {
            return reject(err);
          });
        }

        if (global.isDev) {
          console.debug("---------------------------------------");
          console.debug(
            `SQL QUERY: ${typeof option === "string" ? option : option.sql}`
          );
          console.debug("Fields:", fields);
          console.debug("---------------------------------------");
        }

        return con.commit((err) => {
          if (err) {
            return con.rollback(() => {
              return reject(err);
            });
          }
          return resolve(result);
        });
      });
    });
  });
}
