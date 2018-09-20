var mysql = require('mysql');

var mysqlConfig = {
   host     : 'localhost',
   user     : 'root',
   password : 'qwer1234',
   port     : 3306,
   database : 'hycon',
    connectionLimit: 500,
    waitForConnections: true,
   dateStrings: 'date'
};

exports.dbPool = mysql.createPool(mysqlConfig);
