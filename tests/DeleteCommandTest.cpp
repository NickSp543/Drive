#include <gtest/gtest.h>
#include <fstream>
#include <string>

#include "DeleteCommand.h"
#include "Compressor.h"
#include "InputChecker.h"

TEST(DeleteCommandTest, SimpleDeletionAndResponse) {
    string file = "delete_t1.txt";
    string data = "hello world";

    Compressor::add(file, data);

    InputChecker ic;
    ic.filename = file;

    DeleteCommand cmd;
    string response;

    bool ok = cmd.execute(ic, response);

    EXPECT_TRUE(ok);
    EXPECT_EQ(response, "204 No Content\n");
}

TEST(DeleteCommandTest, NotExistingFile404) {
    string file = "delete_t1.txt";

    InputChecker ic;
    ic.filename = file;

    DeleteCommand cmd;
    string response;

    bool ok = cmd.execute(ic, response);

    EXPECT_FALSE(ok);
    EXPECT_EQ(response, "404 Not Found\n");
}