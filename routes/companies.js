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
      ORDER BY code
  `);
  const companies = result.rows;
  return res.json({ companies });
});

/**
 * GET /companies/[code] Return obj of company:
 * {company: {code, name, description, invoices: [id, ...]}}
 * If the company given cannot be found, this should return a 404 status
 * response.
*/

router.get("/:code", async function (req, res, next) {
  const { code } = req.params;
  const resultC = await db.query(`
    SELECT code, name, description
      FROM companies
      WHERE code = $1
      `, [code]);

  const company = resultC.rows[0];

  if (company === undefined) {
    throw new NotFoundError(`${code} Not Found.`);
  }

  const resultI = await db.query(`
    SELECT id
      FROM invoices
      WHERE comp_code=$1
      ORDER BY id
  `, [code]);

  const invoices = resultI.rows;

  company.invoices = invoices.map(invoice => invoice.id);

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

  const company = result.rows[0];
  return res.status(201).json({ company });
});


/**
  PUT /companies/[code]
  Edit existing company.

  Should return 404 if company cannot be found.

  Needs to be given JSON like: {name, description}

  Returns update company object: {company: {code, name, description}}
*/

router.put('/:code', async function(req,res){

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

  const company = result.rows[0];

  if (company === undefined) {
    throw new NotFoundError(`${code} Not Found.`);
  }

  return res.json({ company })
});

/**
  DELETE /companies/[code]
  Deletes company.

  Should return 404 if company cannot be found.

  Returns {status: "deleted", removed: {code:...}}
 */
router.delete('/:code' , async function(req, res){

  const { code } = req.params

  const result = await db.query(`
    DELETE FROM companies WHERE code=$1
    RETURNING code, name, description
  `,[code]);

  const company = result.rows[0];

  if(company === undefined){
    throw new NotFoundError(`${code} Not Found.`)
  }

  return res.json({ status: "deleted", removed: company.code})
});

module.exports = router;