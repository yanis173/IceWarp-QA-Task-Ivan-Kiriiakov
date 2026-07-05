/**
 * One row of `Customer.PotentialCustomers`, mirroring the assignment's
 * schema. `custContactDate` is stored as a Unix epoch (seconds) integer, as
 * shown by the sample row in the assignment.
 */
export interface PotentialCustomerRecord {
  custId: number;
  custName: string;
  custEmail: string;
  custContactDate: number;
  custNoUsers: number;
  custPhoneNo: string;
  custRole: string;
  custCountry: string;
}
