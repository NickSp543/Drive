#include <gtest/gtest.h>
#include <string>
#include <cstdio>

#include "SearchCommand.h"
#include "Compressor.h"
#include "InputChecker.h"

using std::string;

TEST(SearchCommandTest, NoMatchesReturns404AndFalse) {
    Compressor::add("file1.txt", "hello world");
    Compressor::add("file2.txt", "foo bar");

    InputChecker ic;
    ic.data = "xyz";

    SearchCommand cmd;
    string response;

    bool ok = cmd.execute(ic, response);

    EXPECT_FALSE(ok);
    EXPECT_EQ(response, "404 Not Found\n");

    std::remove("file1.txt");
    std::remove("file2.txt");
}

TEST(SearchCommandTest, MatchByContentReturns200AndFilename) {
    Compressor::add("content_match.txt", "this text contains needle");
    Compressor::add("other.txt", "nothing interesting here");

    InputChecker ic;
    ic.data = "needle";

    SearchCommand cmd;
    string response;

    bool ok = cmd.execute(ic, response);

    EXPECT_TRUE(ok);
    EXPECT_EQ(response, "200 Ok\n\ncontent_match.txt\n");

    std::remove("content_match.txt");
    std::remove("other.txt");
}

TEST(SearchCommandTest,MultipleMatchesAllAppearInResponse) {
    Compressor::add("log1.txt", "log1 inside");
    Compressor::add("log2.txt", "log2 inside");
    Compressor::add("unrelated.txt", "no match");

    InputChecker ic;
    ic.data = "log";

    SearchCommand cmd;
    string response;

    bool ok = cmd.execute(ic, response);

    EXPECT_TRUE(ok);

    string expected =
        "200 Ok\n\n"
        "log1.txt\n"
        "log2.txt\n";

    EXPECT_EQ(response, expected);

    std::remove("log1.txt");
    std::remove("log2.txt");
    std::remove("unrelated.txt");
}
