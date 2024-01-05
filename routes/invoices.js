"use strict";

const express = require("express");

const db = require("../db");

const router = express.Router();

const { NotFoundError, BadRequestError } = require("../expressError")

/**
 * GET /invoices
 * Return info on invoices: like {invoices: [{id, comp_code}, ...]}
*/

router.get("/", async function (req, res, next) {
  const result = await db.query(`
    SELECT id, comp_code
      FROM invoices
      ORDER BY comp_code
  `);
  const invoices = result.rows;
  return res.json({ invoices });
});

/**
 * GET /invoices/[id]
 * Returns obj on given invoice.
 * Returns
 * {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}
 * If invoice cannot be found, returns 404.
*/

router.get("/:id", async function (req, res, next) {
  const invoiceId = req.params.id;

  const result = await db.query(`
    SELECT
        i.id,
        i.amt,
        i.paid,
        i.add_date,
        i.paid_date,
        c.code,
        c.name,
        c.description
      FROM invoices as i
      JOIN companies as c
        ON i.comp_code = c.code
      WHERE id = $1
  `, [invoiceId]);

  const invoice = result.rows[0];
  if(!invoice) throw new NotFoundError(`${invoiceId} Not Found.`);

  const { id, amt, paid, add_date, paid_date, ...company } = invoice;
  return res.json({ invoice: {id, amt, paid, add_date, paid_date, company} });
});

/**
 * POST /invoices
 * Adds an invoice.
 * Needs to be passed in JSON body of: {comp_code, amt}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/

router.post('/', async function (req, res, next){
  if (req.body === undefined){
    throw new BadRequestError();
  }
  const { comp_code, amt } = req.body;
  const result = await db.query(`
    INSERT INTO invoices (comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
  [comp_code,amt]);

  const invoice = result.rows[0];
  return res.json({ invoice })
});

/**
 * PUT /invoices/[id]
 * Updates an invoice.
 * Needs to be passed in a JSON body of {amt}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 * If invoice cannot be found, returns a 404.
*/

router.put('/:id', async function (req, res, next){
  if (req.body === undefined){
    throw new BadRequestError();
  }
  const { id } = req.params;
  const { amt } = req.body;
  // TODO: How to handle bad data gracefully? Would need to do this for all
  // POST/PUT/PATCH/DELETE methods, anything that creates errors in db
  const result = await db.query(`
    UPDATE invoices
      SET amt=$1
      WHERE id=$2
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt,id]);

  const invoice = result.rows[0];
  if (invoice === undefined){
    throw new NotFoundError(`${id} Not Found`)
  }

  return res.json({ invoice })
});

/**
 * DELETE /invoices/[id]
 * Deletes an invoice.
 * Returns: {status: "deleted", invoice: id}
 * If invoice cannot be found, returns a 404.
*/

router.delete("/:id", async function(req, res, next) {
  const { id } = req.params;
  const result = await db.query(`
    DELETE
      FROM invoices
      WHERE id=$1
      RETURNING id
  `, [id]);

  const invoice = result.rows[0];
  if(invoice === undefined) {
    throw new NotFoundError(`${id} Not Found`);
  }
  return res.json({ status: "deleted", invoice: id });
});


module.exports = router;