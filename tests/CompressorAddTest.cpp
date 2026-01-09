#include <gtest/gtest.h>
#include <fstream>
#include <string>
#include "Compressor.h"

using std::string;

static string readFile(const string& filename) {
    std::ifstream in(filename);
    return string((std::istreambuf_iterator<char>(in)),
                   std::istreambuf_iterator<char>());
}

TEST(CompressorAddTest, SimpleCompression) {
    string file = "t1.txt";
    string data = "aaabbbccc";

    Compressor::add(file, data);
    EXPECT_EQ(readFile(file), "3#a3#b3#c");
}

TEST(CompressorAddTest, SingleRun) {
    string file = "t2.txt";
    string data = "xxxxx";

    Compressor::add(file, data);
    EXPECT_EQ(readFile(file), "5#x");
}

TEST(CompressorAddTest, AlternatingCharacters) {
    string file = "t3.txt";
    string data = "ababab";

    Compressor::add(file, data);
    EXPECT_EQ(readFile(file), "1#a1#b1#a1#b1#a1#b");
}

TEST(CompressorAddTest, MixedRuns) {
    string file = "t4.txt";
    string data = "aaabbccccdde";

    Compressor::add(file, data);
    EXPECT_EQ(readFile(file), "3#a2#b4#c2#d1#e");
}

TEST(CompressorAddTest, EmptyString) {
    string file = "t5.txt";
    string data = "";

    Compressor::add(file, data);
    EXPECT_EQ(readFile(file), "");
}

TEST(CompressorAddTest, SingleCharacter) {
    string file = "t6.txt";
    string data = "q";

    Compressor::add(file, data);
    EXPECT_EQ(readFile(file), "1#q");
}

TEST(CompressorAddTest, LongRun) {
    string file = "t7.txt";
    string data(100, 'z');

    Compressor::add(file, data);
    EXPECT_EQ(readFile(file), "100#z");
}
