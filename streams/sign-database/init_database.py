import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")

# Assuming the table name is 'original_table'
table = dynamodb.Table("sign-database")

# new table to save results
new_table = dynamodb.Table("total-sign-database")

# Use a dictionary to count language-token tuples
counter = {}

# Specify the fields you want to retrieve, excluding 'landmarks'
projection_expression = "#token, #timestamp, #language, #path, #userId"
expression_attribute_names = {
    "#token": "token",
    "#timestamp": "timestamp",
    "#language": "language",
    "#path": "path",
    "#userId": "userId",
}

# Pagination
response = table.scan(
    ProjectionExpression=projection_expression,
    ExpressionAttributeNames=expression_attribute_names,
)
data = response["Items"]
progress = 0

while "LastEvaluatedKey" in response:
    response = table.scan(
        ExclusiveStartKey=response["LastEvaluatedKey"],
        ProjectionExpression=projection_expression,
        ExpressionAttributeNames=expression_attribute_names,
    )
    data.extend(response["Items"])
    print("progress", progress)
    progress += 1

for item in data:
    tuple_key = (item["language"], item["token"])

    # update lastUpdate and total for each tuple
    if tuple_key not in counter:
        counter[tuple_key] = {"lastUpdate": int(item["timestamp"]), "total": 1}
    else:
        counter[tuple_key]["lastUpdate"] = max(
            counter[tuple_key]["lastUpdate"], int(item["timestamp"])
        )
        counter[tuple_key]["total"] += 1

# Now put the aggregated data into the new table
for key, value in counter.items():
    new_table.put_item(
        Item={
            "language": {"S": key[0]},
            "token": {"S": key[1]},
            "lastUpdate": {"N": str(value["lastUpdate"])},
            "total": {"N": str(value["total"])},
        }
    )
