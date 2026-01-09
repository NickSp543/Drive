#include <gtest/gtest.h>
#include <string>

#include "GetCommand.h"
#include "Compressor.h"
#include "InputChecker.h"

using std::string;

TEST(GetCommandTest, ExistingFileReturns200AndBody) {
    string file = "get_t1.txt";
    string data = "hello world";

    Compressor::add(file, data);

    InputChecker ic;
    ic.filename = file;

    GetCommand cmd;
    string response;

    bool ok = cmd.execute(ic, response);

    EXPECT_TRUE(ok);
    EXPECT_EQ(response, "200 Ok\n\n" + data + "\n");
}

TEST(GetCommandTest, NonExistingFileReturns404AndFalse) {
    string file = "this_file_does_not_exist.txt";

    InputChecker ic;
    ic.filename = file;

    GetCommand cmd;
    string response;

    bool ok = cmd.execute(ic, response);

    EXPECT_FALSE(ok);
    EXPECT_EQ(response, "404 Not Found\n");
}

TEST(GetCommandTest, EmptyContentIsTreatedAs404) {
    string file = "get_empty.txt";
    string data = "";

    Compressor::add(file, data);

    InputChecker ic;
    ic.filename = file;

    GetCommand cmd;
    string response;

    bool ok = cmd.execute(ic, response);

    EXPECT_FALSE(ok);
    EXPECT_EQ(response, "404 Not Found\n");
}
