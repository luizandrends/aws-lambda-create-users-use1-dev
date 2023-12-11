import { ALBEvent, ALBResult } from 'aws-lambda'
import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
import { hash } from 'bcryptjs'

type LoadBalancerRequestEventInterface = {
  name: string
  email: string
  password: string
}

export const handleRequest = async (event: ALBEvent): Promise<ALBResult> => {
  AWS.config.update({ region: 'us-east-1' })
  const dynamoDbService = new AWS.DynamoDB({ apiVersion: '2012-08-10' })

  const requestBody: LoadBalancerRequestEventInterface = JSON.parse(
    event.body as string,
  )

  const hashedPassword = await hash(requestBody.password, 8)

  const params = {
    TableName: 'aws-dynamodb-users-table-use1-dev',
    Item: {
      id: { S: uuidv4() },
      name: { S: requestBody.name },
      email: { S: requestBody.email },
      password: { S: hashedPassword },
    },
  }
  try {
    const user = await dynamoDbService.putItem(params)

    return {
      isBase64Encoded: false,
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    }
  } catch (err) {
    console.log(err)
    console.log('teste')
    return {
      isBase64Encoded: false,
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Internal server error' }),
    }
  }
}
