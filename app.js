import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import dotenv from 'dotenv';

const app=express();
const port=3000;

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
dotenv.config();

const db=new pg.Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port:process.env.DB_PORT,
});
db.connect();
let countries=[];
let count=0;


async function allCountries(){
  const result=await db.query("select country_code from visited_countries");
  let countries=result.rows.map(row=>row.country_code);
  return countries;
}


app.get('/',async (req,res)=>{
    const result =await db.query("select country_code from visited_countries");
    countries=result.rows.map(row=>row.country_code);
    count=result.rows.length;
    console.log(countries);
    res.render('index.ejs',{countries:countries, total:count});
});

app.post('/add',async (req,res)=>{
   const result=req.body.country;  // canada
   console.log(result);
   try{
       let code=await db.query("select country_code from countries where LOWER(country_name) like LOWER('%' || $1 || '%')",[result]);
       // or using this ==> let code=await db.query("select country_code from countries where LOWER(country_name) like '%' || $1 || '%' ",[result.toLowerCase()]);

       code=code.rows[0].country_code;
       console.log(code);
       try{
           await db.query("insert into visited_countries (country_code) values($1)",[code]);
           res.redirect('/');
       }
       catch (err){
           console.log(err);
           const countries = await allCountries();
           res.render("index.ejs", {
               countries: countries,
               total: countries.length,
               error: "Country has already been added, try again.",
           });
       }

   }
   catch(err){
       console.log(err);
       const countries = await allCountries();
       res.render("index.ejs", {
           countries: countries,
           total: countries.length,
           error: "Country name does not exist, try again.",
       });
   }


});




app.listen(port,()=>{
    console.log(`Server running on http://localhost:${port}`);
});