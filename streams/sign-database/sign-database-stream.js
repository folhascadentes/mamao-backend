const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function updateItem(newImage) {
  const params = {
    TableName: 'total-sign-database',
    Key: {
      token: newImage.token.S,
    },
    UpdateExpression: 'ADD #total :inc SET lastUpdate = :ts',
    ExpressionAttributeNames: {
      '#total': 'total',
    },
    ExpressionAttributeValues: {
      ':inc': 1,
      ':ts': new Date().toISOString(),
    },
    ReturnValues: 'UPDATED_NEW',
  };

  const updatedItem = await docClient.update(params).promise();
  console.log(updatedItem);
}

exports.handler = async (event) => {
  for (const record of event.Records) {
    if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
      const newImage = record.dynamodb.NewImage;
      await updateItem(newImage);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify('Success!'),
  };
};
