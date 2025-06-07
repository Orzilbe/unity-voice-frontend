(()=>{var e={};e.id=8061,e.ids=[8061],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},3371:(e,t,s)=>{"use strict";s.r(t),s.d(t,{patchFetch:()=>N,routeModule:()=>p,serverHooks:()=>k,workAsyncStorage:()=>d,workUnitAsyncStorage:()=>T});var r={};s.r(r),s.d(r,{GET:()=>l});var o=s(96559),a=s(48088),n=s(37719),i=s(32190),c=s(4160),u=s(12909);async function l(e){try{let t=e.headers.get("authorization");if(!t||!t.startsWith("Bearer "))return i.NextResponse.json({message:"לא מורשה"},{status:401});let s=t.split(" ")[1];if(!(0,u.bw)(s))return i.NextResponse.json({message:"טוקן לא תקף"},{status:401});let r=`
      SELECT 
        u.EnglishLevel,
        t.TopicName,
        t.TopicHe,
        COUNT(task.TaskId) as task_count,
        AVG(task.TaskScore) as avg_score,
        COUNT(task.CompletionDate) as completions
      FROM users u
      JOIN tasks task ON u.UserId = task.UserId
      JOIN topics t ON task.TopicName = t.TopicName
      WHERE u.IsActive = 1 AND task.CompletionDate IS NOT NULL
      GROUP BY u.EnglishLevel, t.TopicName, t.TopicHe
      ORDER BY u.EnglishLevel, completions DESC
    `,o=`
      SELECT 
        t.TopicName,
        t.TopicHe,
        COUNT(task.TaskId) as total_tasks,
        COUNT(task.CompletionDate) as completed_tasks,
        ROUND(AVG(task.TaskScore), 1) as avg_score,
        COUNT(DISTINCT task.UserId) as unique_users
      FROM topics t
      JOIN tasks task ON t.TopicName = task.TopicName
      WHERE task.StartDate > DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY t.TopicName, t.TopicHe
      ORDER BY completed_tasks DESC
      LIMIT 10
    `,a=`
      SELECT 
        t.TopicName,
        t.TopicHe,
        AVG(task.DurationTask) as avg_duration_minutes,
        AVG(task.TaskScore) as avg_score,
        COUNT(DISTINCT word.WordId) as unique_words,
        ROUND(AVG(task.TaskScore) / (AVG(task.DurationTask) / 60), 2) as efficiency_score
      FROM topics t
      JOIN tasks task ON t.TopicName = task.TopicName
      LEFT JOIN wordintask wt ON task.TaskId = wt.TaskId
      LEFT JOIN words word ON wt.WordId = word.WordId
      WHERE task.CompletionDate IS NOT NULL 
        AND task.DurationTask > 0
        AND task.CompletionDate > DATE_SUB(NOW(), INTERVAL 90 DAY)
      GROUP BY t.TopicName, t.TopicHe
      ORDER BY efficiency_score DESC
    `,[n,l,p]=await Promise.all([(0,c.eW)(r,[],"Fetch topics by level"),(0,c.eW)(o,[],"Fetch popular topics"),(0,c.eW)(a,[],"Fetch learning efficiency")]);if(!n.success||!l.success||!p.success)return console.error("Database query failed"),i.NextResponse.json({message:"שגיאה בשאילתת מסד הנתונים"},{status:500});let d={topicsByLevel:n.result,popularTopics:l.result,learningEfficiency:p.result};return i.NextResponse.json(d)}catch(e){return console.error("Error fetching topic analysis:",e),i.NextResponse.json({message:"שגיאה בלתי צפויה"},{status:500})}}let p=new o.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/dashboard/topic-analysis/route",pathname:"/api/dashboard/topic-analysis",filename:"route",bundlePath:"app/api/dashboard/topic-analysis/route"},resolvedPagePath:"C:\\Users\\orzil\\OneDrive\\שולחן העבודה\\070525\\unity-voice-frontend-1\\src\\app\\api\\dashboard\\topic-analysis\\route.ts",nextConfigOutput:"",userland:r}),{workAsyncStorage:d,workUnitAsyncStorage:T,serverHooks:k}=p;function N(){return(0,n.patchFetch)({workAsyncStorage:d,workUnitAsyncStorage:T})}},4160:(e,t,s)=>{"use strict";s.d(t,{eW:()=>a});var r=s(46101);async function o(){try{let e=process.env.DB_HOST||process.env.MYSQL_HOST||"localhost",t=process.env.DB_USER||process.env.MYSQL_USER||"root",s=process.env.DB_PASSWORD||process.env.MYSQL_PASSWORD||"",o=process.env.DB_NAME||process.env.MYSQL_DATABASE||"unityvoice",a="true"===process.env.DB_SSL||"true"===process.env.MYSQL_SSL;console.log(`Attempting to connect to MySQL database: ${t}@${e}/${o}`);let n=await r.createConnection({host:e,user:t,password:s,database:o,ssl:a?{rejectUnauthorized:!1}:void 0}),[i]=await n.execute("SELECT 1 as test");return console.log("Database connection successful, test query result:",i),n}catch(e){return console.error("Error creating direct database connection:",e),null}}async function a(e,t,s){let r=null;try{if(!(r=await o()))throw Error("Failed to establish database connection");console.log(`Executing ${s} query:`,e),console.log("Query parameters:",t);let[a]=await r.execute(e,t);return console.log(`${s} query result:`,JSON.stringify(a)),{success:!0,result:a}}catch(e){return console.error(`Error executing ${s} query:`,e),{success:!1,error:e}}finally{if(r)try{await r.end(),console.log("Database connection closed successfully")}catch(e){console.error("Error closing database connection:",e)}}}},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},12909:(e,t,s)=>{"use strict";s.d(t,{bw:()=>a});var r=s(43205),o=s.n(r);function a(e){try{if(!e)return null;let t=process.env.JWT_SECRET||"your-fallback-secret";return o().verify(e,t)}catch(e){return console.error("Token verification failed:",e),null}}s(39466)},19771:e=>{"use strict";e.exports=require("process")},27910:e=>{"use strict";e.exports=require("stream")},28303:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=28303,e.exports=t},28354:e=>{"use strict";e.exports=require("util")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},34631:e=>{"use strict";e.exports=require("tls")},39466:(e,t,s)=>{"use strict";let r=process.env.NEXT_PUBLIC_API_URL;async function o(e){let t=e.headers.get("content-type");if(console.log(`Response status: ${e.status}, Content-Type: ${t}`),t&&t.includes("application/json"))try{let t=await e.json();if(!e.ok){let s={status:e.status,statusText:e.statusText,message:t.message||t.error||"API request failed",responseData:t,url:e.url};throw console.error("API Error (JSON):",s),s}return t}catch(t){if(!e.ok){let s={status:e.status,statusText:e.statusText,message:`Failed to parse JSON response: ${t}`,responseData:null,url:e.url};throw console.error("API Error (JSON Parse Failed):",s),s}throw t}try{let t=await e.text();if(console.log(`Response text (first 200 chars): ${t.substring(0,200)}`),!e.ok){let s={status:e.status,statusText:e.statusText,message:t||"API request failed",responseData:t,url:e.url};throw console.error("API Error (Text):",s),s}return t}catch(s){let t={status:e.status,statusText:e.statusText,message:`Failed to read response: ${s}`,responseData:null,url:e.url};throw console.error("API Error (Text Read Failed):",t),t}}async function a(e,t={}){let s={"Content-Type":"application/json",...t.headers},n=`${r}${e}`;console.log(`Making API call to: ${n}`);try{let e=await fetch(n,{...t,headers:s,credentials:"include"});return await o(e)}catch(t){throw console.error(`API call failed for ${e}:`,{url:n,error:t,errorMessage:t instanceof Error?t.message:"Unknown error",errorStack:t instanceof Error?t.stack:void 0,headers:s}),t&&"object"==typeof t&&(t.endpoint=e,t.fullUrl=n),t}}},41204:e=>{"use strict";e.exports=require("string_decoder")},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},55511:e=>{"use strict";e.exports=require("crypto")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},66136:e=>{"use strict";e.exports=require("timers")},74075:e=>{"use strict";e.exports=require("zlib")},78335:()=>{},79428:e=>{"use strict";e.exports=require("buffer")},79551:e=>{"use strict";e.exports=require("url")},91645:e=>{"use strict";e.exports=require("net")},94735:e=>{"use strict";e.exports=require("events")},96487:()=>{}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[7719,580,3205,6101],()=>s(3371));module.exports=r})();