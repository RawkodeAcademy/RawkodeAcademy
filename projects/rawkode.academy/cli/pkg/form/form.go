package form

import (
	"errors"
	"fmt"
	"reflect"
	"strconv"
	"strings"

	"github.com/charmbracelet/huh"
)

const (
	FormLimitTagName       string = "form-limit"
	JsonTagName            string = "json"
	FormDescriptionTagName string = "form-description"
)

type Form[T any] struct {
	data       T
	validators map[string]func(string) error
	theme      *huh.Theme
}

func NewForm[T any](data T, validators map[string]func(string) error, theme *huh.Theme) *Form[T] {
	return &Form[T]{
		data:       data,
		validators: validators,
		theme:      theme,
	}
}

func charLimit(limit string) int {
	if limit, err := strconv.Atoi(limit); err != nil {
		return limit
	}

	return 4096
}

func description(field reflect.StructField) string {
	prefix := "optional"

	if !strings.Contains(field.Tag.Get(JsonTagName), "omitempty") {
		prefix = "required"
	}

	if field.Tag.Get(FormLimitTagName) != "" {
		prefix = fmt.Sprintf("%s - char limit: %d", prefix, charLimit(field.Tag.Get(FormLimitTagName)))
	}

	if description := field.Tag.Get(FormDescriptionTagName); description != "" {
		return fmt.Sprintf("%s - %s", prefix, description)
	}

	return prefix
}

func validator(field reflect.StructField, validators map[string]func(string) error) func(string) error {
	if validator := validators[field.Name]; validator != nil {
		return validator
	} else if !strings.Contains(field.Tag.Get(JsonTagName), "omitempty") {
		return func(s string) error {
			if s == "" {
				return fmt.Errorf("%s must not be empty", field.Name)
			}

			return nil
		}
	}

	return nil
}

func (form *Form[T]) Run() (*T, error) {
	typeOf := reflect.TypeOf(form.data)

	formFields := make([]huh.Field, 0, typeOf.NumField())

	values := make(map[string]*string)

	for index := 0; index < typeOf.NumField(); index++ {
		field := typeOf.Field(index)

		var formField huh.Field

		switch field.Tag.Get("form-type") {
		case "input":
			values[field.Name] = new(string)

			input := huh.NewInput().Title(field.Name).Value(values[field.Name]).Description(description(field))

			if field.Tag.Get(FormLimitTagName) != "" {
				input = input.CharLimit(charLimit(field.Tag.Get(FormLimitTagName)))
			}

			if validator := validator(field, form.validators); validator != nil {
				input = input.Validate(validator)
			}

			formField = input

		case "text":
			values[field.Name] = new(string)

			text := huh.NewText().Title(field.Name).Value(values[field.Name]).Description(description(field))

			if field.Tag.Get(FormLimitTagName) != "" {
				text = text.CharLimit(charLimit(field.Tag.Get(FormLimitTagName)))
			}

			if validator := validator(field, form.validators); validator != nil {
				text = text.Validate(validator)
			}

			formField = text
		}

		if formField != nil {
			formFields = append(formFields, formField)
		}
	}

	if err := huh.NewForm(huh.NewGroup(formFields...)).WithTheme(form.theme).Run(); err != nil {
		return nil, err
	} else {
		result := reflect.New(typeOf)

		for key, value := range values {
			if value != nil && *value != "" {
				result.Elem().FieldByName(key).SetString(*value)
			}
		}

		if result, ok := result.Interface().(*T); ok {
			return result, nil
		} else {
			return nil, errors.New("cannot instantiate result")
		}
	}
}
