"use strict";

const express = require("express");

const db = require("../db");

const router = express.Router();

const { NotFoundError, BadRequestError } = require("../expressError");

/**
 * GET /companies Returns list of companies, like
 * {companies: [{code, name}, ...]}
*/

router.get("/", async function (req, res, next) {
  const result = await db.query(`
    SELECT code, name, description
      FROM companies
  `);//TODO: ORDER BY...
  const companies = result.rows;
  return res.json({ companies });
});

/**
 * GET /companies/[code] Return obj of company:
 * {company: {code, name, description}}
 * If the company given cannot be found, this should return a 404 status
 * response.
*/

router.get("/:code", async function (req, res, next) {
  const { code } = req.params;
  const result = await db.query(`
    SELECT code, name, description
      FROM companies
      WHERE code = $1
  `, [code]);
  if (result.rows[0] === undefined) {
    throw new NotFoundError(`${code} Not Found.`);
  }
  const company = result.rows[0]; //TODO: could flip so company is undefined
  return res.json({ company });
});

/**
 * POST /companies Adds a company.
 * Needs to be given JSON like: {code, name, description}
 * Returns obj of new company: {company: {code, name, description}}
 * Throws BadRequest if no json received in body of request
*/

router.post("/", async function (req, res, next) {
  if(req.body === undefined) {
    throw new BadRequestError();
  }
  const { code, name, description } = req.body;
  const result = await db.query(`
    INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description
  `, [code, name, description]);
  const newCompany = result.rows[0];
  return res.status(201).json({ newCompany }); //TODO: docstring says return company!
});


/**
  PUT /companies/[code]
  Edit existing company.

  Should return 404 if company cannot be found.

  Needs to be given JSON like: {name, description}

  Returns update company object: {company: {code, name, description}}
*/

router.put('/:code', async function(req,res){
  debugger;//TODO: WHY ISN"T IT HITTING HERE!?!?!!?

  if(req.body === undefined){
    throw new BadRequestError();
  }
  const { code } = req.params;
  const { name, description } = req.body;
  const result = await db.query(`
    UPDATE companies
      SET
          name=$2,
          description=$3
        WHERE code = $1
        RETURNING code, name, description`,
    [code, name, description]);

  console.log("result",result)

  const updatedCompany = result.rows[0];

  console.log("updatedCompany",updatedCompany)

  if (result.rows[0] === undefined) {//TODO:.. same as above
    throw new NotFoundError(`${code} Not Found.`);
  }

  return res.json({ updatedCompany })//TODO:.. same as above
});

/**
  DELETE /companies/[code]
  Deletes company.

  Should return 404 if company cannot be found.

  Returns {status: "deleted", removed: {code:...}}
 */
router.delete('/:code' , async function(req, res){

    const result = await db.query(`
      DELETE FROM companies WHERE code=$1
      RETURNING code, name, description
    `,[req.params.code]);//TODO: be consistent

  const deletedCompany = result.rows[0]; //TODO:.. same as above

  if(!deletedCompany){
    throw new NotFoundError(`${req.params.code} Not Found.`)
  }

  return res.json({ status: "deleted", removed: deletedCompany})//TODO: update to just code vs all company data
});

module.exports = router;