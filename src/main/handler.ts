import { ALBEvent, ALBResult } from 'aws-lambda'
import AWS from 'aws-sdk'
import { hash } from 'bcryptjs'
import { v4 as uuid } from 'uuid'

type LoadBalancerRequestEventInterface = {
  name: string
  email: string
  password: string
}

const ddb = new AWS.DynamoDB({
  apiVersion: '2012-08-10',
  region: 'us-east-1',
})

export const handleRequest = async (event: ALBEvent): Promise<ALBResult> => {
  const requestBody: LoadBalancerRequestEventInterface = JSON.parse(
    event.body as string,
  )

  const creationDate = new Date().toISOString()
  const toStringDate = creationDate.toString()

  const hashedPassword = await hash(requestBody.password, 8)

  const params = {
    TableName: 'aws-dynamodb-users-table-use1-dev',
    Item: {
      id: { S: uuid() },
      name: { S: requestBody.name },
      email: { S: requestBody.email },
      password: { S: hashedPassword },
      created_at: { S: toStringDate },
      updated_at: { S: toStringDate },
    },
  }

  const response = ddb.putItem(params, (err, data) => {
    if (err) {
      return {
        isBase64Encoded: false,
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify("{'message': 'Internal Server Error'}"),
      }
    } else {
      return {
        isBase64Encoded: false,
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    }
  })

  console.log(response)
}
