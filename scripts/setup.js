import { parse, parseFile, parseFileSync } from "jsonc-parse"
import { exec, execSync, spawnSync } from "child_process"
import { fetchCF } from "./cfapi.js"
import { writeFileSync } from "fs"

let c = {
  env: process.env,
}

await parseWrangler(c)

async function parseWrangler(c) {
  const wranglerConfig = await parseFile("../wrangler.jsonc")
  // console.log(wranglerConfig)
  let prod = wranglerConfig.env.prod
  // console.log(prod)
  for (let kv of prod.kv_namespaces) {
    console.log(kv)
    await createKV(c, kv)
  }
  for (let d1 of prod.d1_databases) {
    console.log(d1)
    await createDB(c, d1)
  }
  for (let r2 of prod.r2_buckets) {
    console.log(r2)
    await createR2(c, r2)
  }
  writeFileSync("../wrangler.jsonc", JSON.stringify(wranglerConfig, null, 2))

  console.log("Setup complete!")
}


async function createDB(c, d1) {
  if (d1.database_id) {
    return
  }
  // check if exists first
  let r = await fetchCF(c, "/d1/database", {
    q: { "name": d1.database_name },
  })
  console.log(r)
  if (r.result.length > 0) {
    console.log(`Database ${d1.database_name} already exists with id ${r.result[0].uuid}`)
    d1.database_id = r.result[0].uuid
    return
  }
  console.log(`Creating database ${d1.database_name}`)
  r = await fetchCF(c, "/d1/database", {
    method: "POST",
    body: {
      name: d1.database_name,
      // primary_location_hint: "wnam"
    }
  })
  console.log(r)
  d1.database_id = r.result.uuid

  // let r = await execSync(`npx wrangler d1 create ${d1.database_name}`)
  // console.log(r.toString())
}

async function createKV(c, kv) {
  if (kv.id) {
    return
  }
  // check if exists first
  let r = await fetchCF(c, "/storage/kv/namespaces", {
    q: { "title": kv.title },
  })
  console.log(r)
  for (let kstore of r.result) {
    if (kstore.title === kv.title) {
      console.log(`KV store with title ${kv.title} already exists with id ${kstore.id}`)
      kv.id = kstore.id
      return
    }
  }
  console.log(`Creating KV store ${kv.title}`)
  r = await fetchCF(c, "/storage/kv/namespaces", {
    method: "POST",
    body: {
      title: kv.title,
      // primary_location_hint: "wnam"
    }
  })
  console.log(r)
  kv.id = r.result.id

}

async function createR2(c, r2) {
  // if (r2.id) {
  //   return
  // }
  // check if exists first
  try {
    let r = await fetchCF(c, `/r2/buckets/${r2.bucket_name}`, {})
    console.log(r)
    console.log(`R2 bucket ${r2.bucket_name} already exists`)
    return
  } catch (e) {
    console.error(e, e.data)
    if (e.data.errors.length > 0) {
      let e2 = e.data.errors[0]
      if (e2.code === 10006) { // bucket does not exist
      } else {
        throw e
      }
    }
  }
  console.log(`Creating R2 bucket ${r2.bucket_name}`)
  let r = await fetchCF(c, "/r2/buckets", {
    method: "POST",
    body: {
      name: r2.bucket_name,
      // primary_location_hint: "wnam"
    }
  })
  console.log(r)
  // r2.id = r.result.id
}