#include <gtest/gtest.h>
#include "InputChecker.h"
#include <string>

// ADD COMMAND TESTS

TEST(InputCheckerTest, AddCommand_Valid1) {
    InputChecker ic;
    bool ok = ic.isValidCommand("post file1 data123");
    EXPECT_TRUE(ok);

    EXPECT_EQ(ic.command, "post");
    EXPECT_EQ(ic.filename, "file1");
    EXPECT_EQ(ic.data, "data123");
}

TEST(InputCheckerTest, AddCommand_Valid2) {
    InputChecker ic;
    bool ok = ic.isValidCommand("post     file1     data123");
    EXPECT_TRUE(ok);

    EXPECT_EQ(ic.command, "post");
    EXPECT_EQ(ic.filename, "file1");
    EXPECT_EQ(ic.data, "data123");
}

TEST(InputCheckerTest, AddCommand_MissingDataToCompress) {
    InputChecker ic;
    bool ok = ic.isValidCommand("post file1");
    EXPECT_FALSE(ok);
}

TEST(InputCheckerTest, AddCommand_TooManyArguments) {
    InputChecker ic;
    bool ok = ic.isValidCommand("post too many arguments");
    EXPECT_FALSE(ok);
}

TEST(InputCheckerTest, AddCommand_MissingAllArguments) {
    InputChecker ic;
    bool ok = ic.isValidCommand("post");
    EXPECT_FALSE(ok);
}

// GET COMMAND TESTS

TEST(InputCheckerTest, GetCommand_Valid1) {
    InputChecker ic;
    bool ok = ic.isValidCommand("get file1");
    EXPECT_TRUE(ok);

    EXPECT_EQ(ic.command, "get");
    EXPECT_EQ(ic.filename, "file1");
}

TEST(InputCheckerTest, GetCommand_Valid2) {
    InputChecker ic;
    bool ok = ic.isValidCommand("get     file1");
    EXPECT_TRUE(ok);

    EXPECT_EQ(ic.command, "get");
    EXPECT_EQ(ic.filename, "file1");
}

TEST(InputCheckerTest, GetCommand_TooManyArguments) {
    InputChecker ic;
    bool ok = ic.isValidCommand("get one two");
    EXPECT_FALSE(ok);
}

TEST(InputCheckerTest, GetCommand_MissingFilename) {
    InputChecker ic;
    bool ok = ic.isValidCommand("get");
    EXPECT_FALSE(ok);
}

// SEARCH COMMAND TESTS

TEST(InputCheckerTest, SearchCommand_Valid1) {
    InputChecker ic;
    bool ok = ic.isValidCommand("search string");
    EXPECT_TRUE(ok);

    EXPECT_EQ(ic.command, "search");
    EXPECT_EQ(ic.data, "string");
}

TEST(InputCheckerTest, SearchCommand_Valid2) {
    InputChecker ic;
    bool ok = ic.isValidCommand("search      string");
    EXPECT_TRUE(ok);

    EXPECT_EQ(ic.command, "search");
    EXPECT_EQ(ic.data, "string");
}

TEST(InputCheckerTest, SearchCommand_MissingArgument) {
    InputChecker ic;
    bool ok = ic.isValidCommand("search");
    EXPECT_FALSE(ok);
}

// UNKNOWN COMMAND TESTS

TEST(InputCheckerTest, UnknownCommand) {
    InputChecker ic;
    bool ok = ic.isValidCommand("act file1");
    EXPECT_FALSE(ok);
}

TEST(InputCheckerTest, EmptyInput) {
    InputChecker ic;
    bool ok = ic.isValidCommand("");
    EXPECT_FALSE(ok);
}

TEST(InputCheckerTest, Gibberish) {
    InputChecker ic;
    bool ok = ic.isValidCommand("sdrtyhrtfh asfasdf");
    EXPECT_FALSE(ok);
}

// EDGE CASES

TEST(InputCheckerTest, CommandCaseSensitivity) {
    InputChecker ic;
    bool ok = ic.isValidCommand("POST file1 data");
    EXPECT_TRUE(ok);
}