const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

async function updateItem(newImage) {
  const command = new UpdateCommand({
    TableName: 'total-sign-database',
    Key: {
      language: newImage.language.S,
      token: newImage.token.S,
    },
    UpdateExpression: 'ADD #total :inc SET lastUpdate = :ts',
    ExpressionAttributeNames: {
      '#total': 'total',
    },
    ExpressionAttributeValues: {
      ':inc': 1,
      ':ts': new Date().getTime(),
    },
    ReturnValues: 'UPDATED_NEW',
  });

  return await docClient.send(command);
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
