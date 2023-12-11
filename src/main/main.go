package main

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/google/uuid"
)

type MyEvent struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type ResponseData struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func HandleRequest(ctx context.Context, request events.ALBTargetGroupRequest) (events.ALBTargetGroupResponse, error) {
	event := MyEvent{}
	err := json.Unmarshal([]byte(request.Body), &event)
	if err != nil {
		fmt.Print("Error: ", err)
		return events.ALBTargetGroupResponse{
			IsBase64Encoded: false,
			StatusCode:      500,
			Headers:         map[string]string{"Content-Type": "application/json"},
			Body:            "Failed to create event body",
		}, nil
	}

	fmt.Print("Check MyEvent")

	sess := session.Must(session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	}))

	svc := dynamodb.New(sess)

	currentTime := time.Now().UTC().Format(time.RFC3339)

	item := map[string]*dynamodb.AttributeValue{
		"id": {
			S: aws.String(uuid.New().String()),
		},
		"name": {
			S: aws.String(event.Name),
		},
		"email": {
			S: aws.String(event.Email),
		},
		"password": {
			S: aws.String(event.Password),
		},
		"created_at": {
			S: aws.String(currentTime),
		},
		"updated_at": {
			S: aws.String(currentTime),
		},
	}

	input := &dynamodb.PutItemInput{
		Item:         item,
		TableName:    aws.String("aws-dynamodb-users-table-use1-dev"),
		ReturnValues: aws.String("ALL_NEW"),
	}

	output, err := svc.PutItem(input)

	fmt.Print(output)

	if err != nil {
		return events.ALBTargetGroupResponse{
			IsBase64Encoded: false,
			StatusCode:      500,
			Headers:         map[string]string{"Content-Type": "application/json"},
			Body:            "Failed to create the user in the database",
		}, nil
	}

	responseData := ResponseData{
		ID:        *output.Attributes["ID"].S,
		Name:      *output.Attributes["Name"].S,
		Email:     *output.Attributes["Email"].S,
		CreatedAt: *output.Attributes["CreatedAt"].S,
		UpdatedAt: *output.Attributes["UpdatedAt"].S,
	}

	fmt.Print("Check ResponseData")

	responseBody, err := json.Marshal(responseData)
	if err != nil {

		fmt.Print("Error: ", err)

		return events.ALBTargetGroupResponse{
			IsBase64Encoded: false,
			StatusCode:      500,
			Headers:         map[string]string{"Content-Type": "application/json"},
			Body:            "Failed to create response body",
		}, nil
	}

	fmt.Print("Check ResponseBody")

	return events.ALBTargetGroupResponse{
		IsBase64Encoded: false,
		StatusCode:      200,
		Headers:         map[string]string{"Content-Type": "application/json"},
		Body:            string(responseBody),
	}, nil
}

func main() {
	lambda.Start(HandleRequest)
}
