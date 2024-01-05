"use strict";

const express = require("express");

const db = require("../db");

const router = express.Router();

const { NotFoundError } = require("../expressError")

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
 * If invoice cannot be found, returns 404.
 * Returns
 * {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}
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

module.exports = router;