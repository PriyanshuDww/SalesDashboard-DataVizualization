export class DataService {
  constructor() {
    this.data = null;
    this.loadPromise = null;
    this.filters = {
      country: null,
      productLine: null,
      customer: null,
      selectedMonths: [],
    };
  }

  async loadData() {
    if (this.loadPromise) return this.loadPromise;

    const parseDate = d3.timeParse("%m/%d/%Y");
    this.loadPromise = d3
      .csv("imputed_sales_data.csv", (d) => ({
        country: d.COUNTRY.trim(),
        sales: +d.SALES,
        quantity: +d.QUANTITYORDERED,
        productLine: d.PRODUCTLINE.trim(),
        status: d.STATUS.trim(),
        customer: d.CUSTOMERNAME.trim(),
        dealSize: d.DEALSIZE.trim(),
        orderDate: parseDate(d.ORDERDATE.trim()),
        priceEach: +d.PRICEEACH,
      }))
      .then((data) => {
        this.data = data;
        return data;
      });

    return this.loadPromise;
  }

  setFilter(key, value) {
    this.filters[key] = value;
  }

  setMonthFilter(monthList) {
    this.filters.selectedMonths = monthList;
  }

  clearFilters() {
    this.filters = {
      country: null,
      productLine: null,
      customer: null,
      selectedMonths: [],
    };
  }

  getFilteredData() {
    if (!this.data) return [];

    return this.data.filter((d) => {
      const { country, productLine, customer, selectedMonths } = this.filters;
      if (country && d.country !== country) return false;
      if (productLine && d.productLine !== productLine) return false;
      if (customer && d.customer !== customer) return false;
      if (selectedMonths.length > 0) {
        const recordMonth = d.orderDate?.toISOString().slice(0, 7);
        if (!selectedMonths.includes(recordMonth)) return false;
      }
      return true;
    });
  }

  getAllCountries() {
    return this.data
      ? Array.from(new Set(this.data.map((d) => d.country))).sort()
      : [];
  }

  getAllProductLines() {
    return this.data
      ? Array.from(new Set(this.data.map((d) => d.productLine))).sort()
      : [];
  }

  getAllCustomers() {
    return this.data
      ? Array.from(new Set(this.data.map((d) => d.customer))).sort()
      : [];
  }

  getAllOrderMonths() {
    return this.data
      ? Array.from(
          new Set(this.data.map((d) => d.orderDate?.toISOString().slice(0, 7)))
        ).sort()
      : [];
  }
}

export const dataService = new DataService();
