#include <gtest/gtest.h>
#include <string>
#include <vector>
#include <algorithm>
#include "Compressor.h"

using std::string;
using std::vector;

class SearchTest : public ::testing::Test {
protected:
    void SetUp() override {
        // Create test files before each test
        Compressor::add("search1.txt", "hello world");
        Compressor::add("search2.txt", "goodbye world");
        Compressor::add("search3.txt", "hello there");
        Compressor::add("search4.txt", "nothing here");
    }

    // Helper: check if a vector contains a filename
    bool contains(const vector<string>& v, const string& name) {
        return std::find(v.begin(), v.end(), name) != v.end();
    }
};

TEST_F(SearchTest, FindInMultipleFiles) {
    vector<string> result = Compressor::search("world");

    EXPECT_TRUE(contains(result, "search1.txt"));
    EXPECT_TRUE(contains(result, "search2.txt"));
    
    EXPECT_FALSE(contains(result, "search3.txt"));
    EXPECT_FALSE(contains(result, "search4.txt"));
}

TEST_F(SearchTest, FindInSingleFile) {
    vector<string> result = Compressor::search("goodbye");

    EXPECT_TRUE(contains(result, "search2.txt"));
    EXPECT_FALSE(contains(result, "search1.txt"));
}

TEST_F(SearchTest, FindHello) {
    vector<string> result = Compressor::search("hello");

    EXPECT_TRUE(contains(result, "search1.txt"));
    EXPECT_TRUE(contains(result, "search3.txt"));
}

TEST_F(SearchTest, NoMatch) {
    vector<string> result = Compressor::search("xyz");

    EXPECT_TRUE(result.empty());
}

TEST_F(SearchTest, PartialMatch) {
    vector<string> result = Compressor::search("ere");  // part of "there"
    
    EXPECT_TRUE(contains(result, "search3.txt"));
}

TEST_F(SearchTest, EmptySearch) {
    vector<string> result = Compressor::search("");

    EXPECT_TRUE(contains(result, "search1.txt"));
    EXPECT_TRUE(contains(result, "search2.txt"));
    EXPECT_TRUE(contains(result, "search3.txt"));
    EXPECT_TRUE(contains(result, "search4.txt"));
}

TEST_F(SearchTest, CaseSensitive) {
    vector<string> result = Compressor::search("WORLD");

    EXPECT_TRUE(result.empty());
}

TEST_F(SearchTest, SearchInEmptyFile) {
    Compressor::add("empty.txt", "");
    vector<string> result = Compressor::search("test");

    EXPECT_FALSE(contains(result, "empty.txt"));
}
