// const mapNumber = (value: any) => {
//   const num = Number(value);
//   return isNaN(num) ? value : num;
// };

// const mapChildren = (childrens: any[] = []) =>
//   childrens.map((child) => ({
//     parent: child.parent,
//     id: child.id,
//     name: child.name,
//     label: child.label,
//     disabled: child.disabled,
//     checked: child.checked,
//     percentage: mapNumber(child.percentage),
//   }));

// const mapBusinessLines = (lines: any[]) =>
//   lines.map((line) => {
//     const mapped: any = {
//       id: line.id,
//       name: line.name,
//       label: line.label,
//       checked: line.checked,
//     };

//     if (Array.isArray(line.childrens)) {
//       mapped.childrens = mapChildren(line.childrens);
//     }

//     return mapped;
//   });

export const mapQuoteObject = (original: any) => {
  // Calculate total amount (MXN)
  const totalAmount = Number(original.total) || 0;

  // Only selected business lines
  const selectedBusinessLines = (original.businessLines || [])
    .filter((line: any) => {
      return line.checked;
    })
    .map((line: any) => {
      const services = (line.childrens || [])
        .filter((svc: any) => {
          return svc.checked;
        })
        .map((svc: any) => {
          const percentage = Number(svc.percentage) || 0;
          const amount = ((percentage / 100) * totalAmount) || 0;
          return {
            id: svc.id,
            businessLineServiceId: svc.id,
            checked: true,
            disabled: !!svc.disabled,
            percentage,
            amount,
          };
        });
      
      
      return {
        id: line.id,
        businessLineId: line.id,
        checked: true,
        quoteTrackingBusinessLineServicesDto: services,
      };
    });
  

  const mappedResult = {
    id: original.id || 0,
    quoteCreationType: Number(original.quoteCreationType),
    quoteNumber: original.generalInformation.quoteNumber,
    projectManagerId: original.generalInformation.projectManager ? Number(original.generalInformation.projectManager) : null,
    quoteCreatedDate: new Date(original.generalInformation.quoteDate).toISOString(),
    saleTypeId: original.generalInformation.quoteType ? Number(original.generalInformation.quoteType) : 0,
    revision: Number(original.generalInformation.revision),
    description: original.generalInformation.description,
    quoteStatusId: Number(original.generalInformation.status),
    customer: {
      customerId: Number(original.userInformation.clientName),
      customerClassificationId: Number(original.userInformation.customerCategory),
      customerTypeId: Number(original.userInformation.clientType),
      clientTypeId: Number(original.userInformation.clientType),
      verticalMarketId: Number(original.userInformation.verticalMarket),
      customerCategoryTypeId: Number(original.clientOrProspect === 'prospect' ? 2 : 1),
      location: Number(original.userInformation.location) || 0, // Convert to number instead of string
    },
    amount: {
      mxpAmount: Number(original.amount) || 0,
      usdAmount: Number(original.amountUSD) || 0,
      usdExchange: Number(original.exchangeRate) || 0,
    },
    quoteTrackingDto: {
      id: original.id || 0,
      status: "Active"
    },
    quoteTrackingBusinessLines: selectedBusinessLines,
  };
  
  return mappedResult;
};
