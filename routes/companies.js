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
  `);
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
  const company = result.rows[0];
  return res.json({ company }); ß;
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
  return res.status(201).json({ newCompany });
});





module.exports = router;