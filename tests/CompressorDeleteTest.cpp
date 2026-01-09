#include <gtest/gtest.h>
#include <fstream>
#include <string>
#include <filesystem>
#include "Compressor.h"

TEST(CompressorDeleteTest, SimpleDeletion) {
    string file = "file.txt";
    string data = "abc";

    Compressor::add(file, data);
    ASSERT_TRUE(std::filesystem::exists(file));

    int result = Compressor::deletef(file);

    EXPECT_EQ(result, 0);
    EXPECT_FALSE(std::filesystem::exists(file));
}

TEST(CompressorDeleteTest, DeleteNotExistingFile) {
    string file = "file.txt";

    ASSERT_FALSE(std::filesystem::exists(file));

    int result = Compressor::deletef(file);

    EXPECT_EQ(result, 1);
    EXPECT_FALSE(std::filesystem::exists(file));
}

TEST(CompressorDeleteTest, DeleteFileTwice) {
    string file = "file.txt";
    string data = "abc";

    Compressor::add(file, data);
    ASSERT_TRUE(std::filesystem::exists(file));

    int result = Compressor::deletef(file);

    EXPECT_EQ(result, 0);
    EXPECT_FALSE(std::filesystem::exists(file));

    int result2 = Compressor::deletef(file);
    EXPECT_EQ(result2, 1);
    EXPECT_FALSE(std::filesystem::exists(file));
}