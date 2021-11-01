function getURL(url: string, callback: (response: string) => void): void {
  const request = new XMLHttpRequest();

  request.onload = function () {
    callback(this.responseText)
  }

  request.onerror = function () {
    console.error("There was an error")
  }

  request.open("GET", url);
  request.send();
}

type DataType = "string" | "float" | "int" | "raw" | "bool"

function parseCSV(data: string, dataFormat: { [key: string]: DataType }): any[] {
  const rows = data.split(/\r?\n/)
  const headers = rows[0].split(",").map(col => col.slice(1, col.length - 1))
  const result: any[] = []
  for (let i = 1; i < rows.length; i++) {
    const rowObject: { [key: string]: any } = {}
    const row: string[] = []
    let col = ""
    for (let charIndex = 0; charIndex < rows[i].length; charIndex++) {
      const char = rows[i][charIndex]
      const nextChar = rows[i][charIndex + 1]
      if (char === "," && nextChar !== " ") {
        row.push(col)
        col = ""
      } else if (nextChar == null) {
        row.push(col.concat(char))
        col = ""
      } else {
        col = col.concat(char)
      }
    }
    for (let j = 0; j < row.length; j++) {
      if (dataFormat[headers[j]] != null) {
        switch (dataFormat[headers[j]]) {
          case "string":
            rowObject[headers[j]] = row[j].slice(1, row[j].length - 1)
            break;
          case "float":
            rowObject[headers[j]] = parseFloat(row[j])
            break;
          case "int":
            rowObject[headers[j]] = parseInt(row[j], 10)
            break;
          case "bool":
            rowObject[headers[j]] = row[j].toLowerCase() === "true"
            break;
          case "raw":
            rowObject[headers[j]] = row[j]
            break;
        }
      } else {
        rowObject[headers[j]] = row[j]
      }
    }
    result.push(rowObject)
  }
  return result;
}

window.onload = function (): void {
  // https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/42MVDX&version=6.0
  getURL("data/1976-2020-president.csv", response => {
    // Example:
    // "year","state","state_po","state_fips","state_cen","state_ic","office","candidate","party_detailed","writein","candidatevotes","totalvotes","version","notes","party_simplified"
    // 1976,"ALABAMA","AL",1,63,41,"US PRESIDENT","CARTER, JIMMY","DEMOCRAT",FALSE,659170,1182850,"20210113",NA,"DEMOCRAT"
    const data = parseCSV(
      response,
      {
        year: "int",
        state: "string",
        state_po: "string",
        state_fips: "int",
        state_cen: "int",
        state_ic: "int",
        office: "string",
        candidate: "string",
        party_detailed: "string",
        writein: "bool",
        candidatevotes: "int",
        totalvotes: "int",
        version: "string",
        notes: "raw",
        party_simplified: "string",
      }
    )
    console.log(data)
  });
}
