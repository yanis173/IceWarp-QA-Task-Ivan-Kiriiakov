import mysql, { Connection, RowDataPacket } from "mysql2/promise";
import { dbConfig } from "./config";
import { PotentialCustomerRecord } from "./types";

/** Row shape as it comes back from the driver, before field-name mapping. */
interface PotentialCustomerRow extends RowDataPacket {
  cust_id: number;
  cust_name: string;
  cust_email: string;
  cust_contact_date: number;
  cust_no_users: number;
  cust_phone_no: string;
  cust_role: string;
  cust_country: string;
}

/**
 * Data-access class for the `Customer.PotentialCustomers` table (the
 * "blind part" of the assignment): connects to the database, looks up the
 * row a contact-form submission created, and disconnects again.
 */
export class PotentialCustomersRepository {
  private connection: Connection | null = null;

  /** Opens the database connection (blind-part step 1). */
  async connect(): Promise<void> {
    this.connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
    });
  }

  /** Closes the database connection. Safe to call even if never connected. */
  async disconnect(): Promise<void> {
    await this.connection?.end();
    this.connection = null;
  }

  /**
   * Looks up the `PotentialCustomers` row for the given e-mail address
   * (blind-part step 2's data source), returning `null` if the contact
   * form's submission was never inserted (e.g. it was blocked by
   * reCAPTCHA before reaching the backend).
   */
  async findByEmail(email: string): Promise<PotentialCustomerRecord | null> {
    if (!this.connection) {
      throw new Error("Not connected - call connect() first.");
    }

    const [rows] = await this.connection.query<PotentialCustomerRow[]>(
      `SELECT cust_id, cust_name, cust_email, cust_contact_date, cust_no_users, cust_phone_no, cust_role, cust_country
       FROM ${dbConfig.table}
       WHERE cust_email = ?`,
      [email],
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      custId: row.cust_id,
      custName: row.cust_name,
      custEmail: row.cust_email,
      custContactDate: row.cust_contact_date,
      custNoUsers: row.cust_no_users,
      custPhoneNo: row.cust_phone_no,
      custRole: row.cust_role,
      custCountry: row.cust_country,
    };
  }
}
