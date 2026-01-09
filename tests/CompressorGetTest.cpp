#include <gtest/gtest.h>
#include <fstream>
#include <string>
#include "Compressor.h"

using std::string;

// Helper: write raw content to a file (simulates compressed data)
void writeToFile(const string& filename, const string& content) {
    std::ofstream out(filename);
    out << content;
}

// --- TESTS FOR get() ---

TEST(CompressorGetTest, SimpleDecompression) {
    string filename = "get_test1.txt";
    writeToFile(filename, "3a3b3c");

    string output = Compressor::get(filename);
    EXPECT_EQ(output, "aaabbbccc");
}

TEST(CompressorGetTest, SingleRun) {
    string filename = "get_test2.txt";
    writeToFile(filename, "5x");

    string output = Compressor::get(filename);
    EXPECT_EQ(output, "xxxxx");
}

TEST(CompressorGetTest, AlternatingCharacters) {
    string filename = "get_test3.txt";
    writeToFile(filename, "1a1b1a1b");

    string output = Compressor::get(filename);
    EXPECT_EQ(output, "abab");
}

TEST(CompressorGetTest, MixedRuns) {
    string filename = "get_test4.txt";
    writeToFile(filename, "3a2b4c2d1e");

    string output = Compressor::get(filename);
    EXPECT_EQ(output, "aaabbccccdde");
}

TEST(CompressorGetTest, EmptyFile_ReturnsEmpty) {
    string filename = "get_test5.txt";
    writeToFile(filename, "");

    string output = Compressor::get(filename);
    EXPECT_EQ(output, "");
}

TEST(CompressorGetTest, OnlyNumber_NoLetter_Ignored) {
    string filename = "get_test6.txt";
    writeToFile(filename, "12345"); // invalid input

    string output = Compressor::get(filename);
    EXPECT_EQ(output, "");  // should ignore orphan numbers
}

TEST(CompressorGetTest, LongRun) {
    string filename = "get_test7.txt";
    writeToFile(filename, "100z");

    string output = Compressor::get(filename);
    EXPECT_EQ(output, string(100, 'z'));
}

TEST(CompressorGetTest, MultiDigitCount) {
    string filename = "get_test8.txt";
    writeToFile(filename, "12a3b");

    string output = Compressor::get(filename);
    EXPECT_EQ(output, "aaaaaaaaaaaabbb");
}
