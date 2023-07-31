const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  for (const record of event.Records) {
    if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
      const newImage = AWS.DynamoDB.Converter.unmarshall(
        record.dynamodb.NewImage,
      );
      const token = newImage.token;
      const language = newImage.language;
      const timestamp = newImage.timestamp;

      const params = {
        TableName: 'total-sign-database',
        Key: {
          token: token,
          language: language,
        },
      };

      const response = await docClient.get(params).promise();

      if (response.Item) {
        // Update existing item
        response.Item.lastUpdate = Math.max(
          response.Item.lastUpdate,
          timestamp,
        );
        response.Item.total += 1;

        await docClient
          .put({ TableName: 'total-sign-database', Item: response.Item })
          .promise();
      } else {
        // Insert new item
        const item = {
          token: token,
          language: language,
          lastUpdate: timestamp,
          total: 1,
        };

        await docClient
          .put({ TableName: 'total-sign-database', Item: item })
          .promise();
      }
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify('Success!'),
  };
};
