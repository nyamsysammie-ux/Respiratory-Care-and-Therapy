// Server settings you may want to change.
module.exports = {
  // How long a login lasts.
  sessionDays: 7,

  // Who may read / write which saved keys. The FIRST matching rule wins.
  // A key that matches no rule can be read and written by any signed-in account.
  // Roles: "admin", "lecturer", "student".
  //
  // Open your app, press F12 > Console and run:  MongoSync.keys()
  // to see the real key names, then add rules such as:
  //
  // { pattern: /^tsmhst\.users$/,   read: ["admin", "lecturer"], write: ["admin"] },
  // { pattern: /^tsmhst\.results/,  read: ["admin", "lecturer", "student"], write: ["admin", "lecturer"] },
  keyRules: [],
};
