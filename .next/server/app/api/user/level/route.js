(()=>{var e={};e.id=3888,e.ids=[3888],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19771:e=>{"use strict";e.exports=require("process")},27910:e=>{"use strict";e.exports=require("stream")},28303:e=>{function r(e){var r=Error("Cannot find module '"+e+"'");throw r.code="MODULE_NOT_FOUND",r}r.keys=()=>[],r.resolve=r,r.id=28303,e.exports=r},28354:e=>{"use strict";e.exports=require("util")},29021:e=>{"use strict";e.exports=require("fs")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:e=>{"use strict";e.exports=require("path")},34631:e=>{"use strict";e.exports=require("tls")},41204:e=>{"use strict";e.exports=require("string_decoder")},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},55511:e=>{"use strict";e.exports=require("crypto")},56285:(e,r,t)=>{"use strict";t.d(r,{KP:()=>d});var s=t(46101),o=t(29021),n=t.n(o),i=t(33873),l=t.n(i);let a=null,c=0,u={host:process.env.MYSQL_HOST||"localhost",user:process.env.MYSQL_USER||"root",password:process.env.MYSQL_PASSWORD||"",database:process.env.MYSQL_DATABASE||"unityvoice",port:parseInt(process.env.MYSQL_PORT||"3306"),ssl:"true"===process.env.MYSQL_SSL};async function p(){if(a)return a;try{let e;c++;let r=l().join(process.cwd(),"src/config/DigiCertGlobalRootCA.crt.pem");n().existsSync(r)?(console.log(`SSL certificate found at: ${r}`),e=n().readFileSync(r)):console.log("SSL certificate not found, using default SSL configuration"),console.log(`[${new Date().toISOString()}] Database configuration:`,{host:u.host,user:u.user,database:u.database,port:u.port,ssl:u.ssl,passwordProvided:!!u.password,environment:"production"}),u.host&&u.user||console.error("CRITICAL: Missing essential database credentials (host or user)"),u.password||console.error("CRITICAL: No database password provided - connection will likely fail"),console.log(`[${new Date().toISOString()}] Attempting to connect to MySQL database (attempt ${c}/3)`);let t={host:u.host,user:u.user,password:u.password,database:u.database,port:u.port,ssl:u.ssl?e?{ca:e,rejectUnauthorized:!1}:{rejectUnauthorized:!1}:void 0,waitForConnections:!0,connectionLimit:10,queueLimit:0,connectTimeout:1e4};a=s.createPool(t);let o=await a.getConnection();return console.log(`[${new Date().toISOString()}] Successfully connected to MySQL database`),o.release(),c=0,a}catch(r){let e=r instanceof Error?r.message:String(r);if(console.error(`[${new Date().toISOString()}] Failed to connect to MySQL database:`,e),console.error("Database connection error details:",r),console.error("Environment context:",{NODE_ENV:"production",cwd:process.cwd(),MYSQL_HOST_set:!!process.env.MYSQL_HOST,MYSQL_USER_set:!!process.env.MYSQL_USER,MYSQL_DATABASE_set:!!process.env.MYSQL_DATABASE,MYSQL_PASSWORD_set:!!process.env.MYSQL_PASSWORD}),c<3)return console.log("Retrying database connection in 3 seconds..."),await new Promise(e=>setTimeout(e,3e3)),p();throw c=0,Error(`Database connection failed: ${e}`)}}async function d(){try{return await p()}catch(e){return console.error("Database connection failed, returning null:",e),null}}},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},66136:e=>{"use strict";e.exports=require("timers")},74075:e=>{"use strict";e.exports=require("zlib")},78335:()=>{},79428:e=>{"use strict";e.exports=require("buffer")},79551:e=>{"use strict";e.exports=require("url")},91645:e=>{"use strict";e.exports=require("net")},94735:e=>{"use strict";e.exports=require("events")},95669:(e,r,t)=>{"use strict";t.r(r),t.d(r,{patchFetch:()=>h,routeModule:()=>L,serverHooks:()=>R,workAsyncStorage:()=>v,workUnitAsyncStorage:()=>E});var s={};t.r(s),t.d(s,{GET:()=>g});var o=t(96559),n=t(48088),i=t(37719),l=t(32190),a=t(56285);async function c(e,r){try{if(!e||!r)return console.warn("getUserHighestLevel: Missing parameter",{userId:e,topicName:r}),1;console.log(`getUserHighestLevel: Checking level for user ${e} in topic "${r}"`);let t=await (0,a.KP)();if(!t)return console.error("getUserHighestLevel: Database connection not available"),1;let s=r.includes(" ")&&/[A-Z]/.test(r)?r:r.split("-").map((e,r,t)=>"and"===e.toLowerCase()?"and":e.charAt(0).toUpperCase()+e.slice(1).toLowerCase()).join(" ");console.log(`getUserHighestLevel: Checking for topic formats: DB="${s}"`),console.log(`getUserHighestLevel: SQL parameters - userId=${e}, dbTopicName=${s}`);try{let r=`
        SELECT Level FROM userinlevel 
        WHERE UserId = ? AND (
          TopicName = ? OR 
          TopicName = ? OR
          LOWER(TopicName) = LOWER(?) OR
          LOWER(TopicName) = LOWER(?) OR
          REPLACE(LOWER(TopicName), ' ', '-') = LOWER(?) OR
          REPLACE(LOWER(?), '-', ' ') = LOWER(TopicName)
        )
        ORDER BY Level DESC
        LIMIT 1
      `,o=[e,s,s,s,s,s,s];console.log("getUserHighestLevel: Executing query with params:",o);let[n]=await t.query(r,o);if(console.log("getUserHighestLevel: Query results:",n),Array.isArray(n)&&n.length>0){let e=parseInt(n[0].Level,10);return console.log(`getUserHighestLevel: Found user level ${e} for topic "${s}"`),e}console.log("getUserHighestLevel: No records in userinlevel, checking Tasks table");let i=`
        SELECT DISTINCT Level 
        FROM Tasks 
        WHERE UserId = ? 
          AND (
            TopicName = ? OR 
            TopicName = ? OR
            LOWER(TopicName) = LOWER(?) OR
            LOWER(TopicName) = LOWER(?) OR
            REPLACE(LOWER(TopicName), ' ', '-') = LOWER(?) OR
            REPLACE(LOWER(?), '-', ' ') = LOWER(TopicName)
          )
          AND CompletionDate IS NOT NULL
        ORDER BY Level DESC
        LIMIT 1
      `;console.log("getUserHighestLevel: Checking completed tasks with params:",o);let[l]=await t.query(i,o);if(console.log("getUserHighestLevel: Completed tasks results:",l),Array.isArray(l)&&l.length>0){let r=parseInt(l[0].Level,10),o=r>=3?3:r+1;console.log(`getUserHighestLevel: Found completed tasks at level ${r}, next level is ${o}`);try{let r=`
            INSERT INTO userinlevel (UserId, TopicName, Level, EarnedScore, CompletedAt)
            VALUES (?, ?, ?, 0, NOW())
            ON DUPLICATE KEY UPDATE 
              Level = VALUES(Level),
              CompletedAt = NOW()
          `;await t.query(r,[e,s,o]),console.log(`getUserHighestLevel: Updated userinlevel table with level ${o} for topic "${s}"`)}catch(e){console.error("getUserHighestLevel: Error updating userinlevel table:",e)}return o}console.log("getUserHighestLevel: No completed tasks, checking for open tasks");let a=`
        SELECT DISTINCT Level 
        FROM Tasks 
        WHERE UserId = ? 
          AND (
            TopicName = ? OR 
            TopicName = ? OR
            LOWER(TopicName) = LOWER(?) OR
            LOWER(TopicName) = LOWER(?) OR
            REPLACE(LOWER(TopicName), ' ', '-') = LOWER(?) OR
            REPLACE(LOWER(?), '-', ' ') = LOWER(TopicName)
          )
        ORDER BY Level ASC
        LIMIT 1
      `;console.log("getUserHighestLevel: Checking open tasks with params:",o);let[c]=await t.query(a,o);if(console.log("getUserHighestLevel: Open tasks results:",c),Array.isArray(c)&&c.length>0){let r=parseInt(c[0].Level,10);console.log(`getUserHighestLevel: Found open tasks at level ${r}`);try{let o=`
            INSERT INTO userinlevel (UserId, TopicName, Level, EarnedScore)
            VALUES (?, ?, ?, 0)
            ON DUPLICATE KEY UPDATE 
              Level = VALUES(Level)
          `;await t.query(o,[e,s,r]),console.log(`getUserHighestLevel: Updated userinlevel table with starting level ${r} for topic "${s}"`)}catch(e){console.error("getUserHighestLevel: Error updating userinlevel table for open tasks:",e)}return r}console.log("getUserHighestLevel: No tasks found, using default level 1");try{let r=`
          INSERT INTO userinlevel (UserId, TopicName, Level, EarnedScore)
          VALUES (?, ?, 1, 0)
          ON DUPLICATE KEY UPDATE 
            Level = 1
        `;await t.query(r,[e,s]),console.log(`getUserHighestLevel: Created new userinlevel record with level 1 for topic "${s}"`)}catch(e){console.error("getUserHighestLevel: Error creating userinlevel record:",e)}return 1}catch(e){return console.error("getUserHighestLevel: Database error checking user level:",e),1}}catch(e){return console.error("getUserHighestLevel: Unexpected error:",e),1}}var u=t(43205),p=t.n(u);async function d(e){let r=e.headers.get("Authorization");if(!r||!r.startsWith("Bearer "))return{isValid:!1,userId:""};let t=r.substring(7);try{let e=p().verify(t,process.env.JWT_SECRET||"default_secret"),r=e.userId||e.id;if(console.log(`Token verified successfully. User ID: ${r}`),!r)return console.warn("Token verified but no userId/id found in token payload"),{isValid:!1,userId:""};return{isValid:!0,userId:r}}catch(e){return console.error("Token verification failed:",e),{isValid:!1,userId:""}}}async function g(e){console.group("GET /api/user/level");try{let r=await d(e);if(!r.isValid)return console.error("Unauthorized request"),console.groupEnd(),l.NextResponse.json({message:"Unauthorized"},{status:401});let t=r.userId,{searchParams:s}=new URL(e.url),o=s.get("topicName");if(!o)return console.error("Missing topicName parameter"),console.groupEnd(),l.NextResponse.json({message:"Topic name is required"},{status:400});console.log(`Fetching level for topic: "${o}"`),console.log(`User authenticated: ${t}`);let n=await c(t,o);return console.log(`User level for topic "${o}": ${n}`),console.groupEnd(),l.NextResponse.json({level:n})}catch(e){return console.error("Error fetching user level:",e),console.groupEnd(),l.NextResponse.json({message:"Failed to fetch user level",error:e instanceof Error?e.message:"Unknown error"},{status:500})}}let L=new o.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/user/level/route",pathname:"/api/user/level",filename:"route",bundlePath:"app/api/user/level/route"},resolvedPagePath:"C:\\Projects\\100625\\unity-voice-frontend\\src\\app\\api\\user\\level\\route.ts",nextConfigOutput:"",userland:s}),{workAsyncStorage:v,workUnitAsyncStorage:E,serverHooks:R}=L;function h(){return(0,i.patchFetch)({workAsyncStorage:v,workUnitAsyncStorage:E})}},96487:()=>{}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[7719,580,3205,6101],()=>t(95669));module.exports=s})();