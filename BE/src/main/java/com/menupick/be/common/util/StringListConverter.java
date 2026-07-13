package com.menupick.be.common.util;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        return attribute == null || attribute.isEmpty()
                ? null
                : attribute.stream().map(String::trim).collect(Collectors.joining(","));
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        return dbData == null || dbData.isBlank()
                ? Arrays.asList()
                : Arrays.stream(dbData.split(",")).map(String::trim).collect(Collectors.toList());
    }
}