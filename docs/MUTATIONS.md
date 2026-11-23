# Mutations

Written by `python scripts/mutate.py --table docs/MUTATIONS.md`. 75 defences in
`contracts/suspect.py` were each broken on their own, and every mutant was caught. Each row
names the first test that failed against it, read from pytest's report rather than an exit code.
The generated-copy and deployed-record tests are excluded, because they fail for any edit at all.

| # | defence broken | caught by |
|---|---|---|
| 1 | a contradiction no longer eliminates | `tests/test_direct.py::test_one_hypothesis_against_three_clues_every_combination[C]` |
| 2 | a board with no clue counts its hypotheses as tested | `tests/test_direct.py::test_propose_holds_the_bond_and_records_the_author` |
| 3 | untested pairs are ignored | `tests/test_direct.py::test_one_hypothesis_against_three_clues_every_combination[]` |
| 4 | a hypothesis that explains nothing can lead | `tests/test_direct.py::test_one_hypothesis_against_three_clues_every_combination[SSS]` |
| 5 | near-leaders lead too | `tests/test_direct.py::test_ties_share_leading_and_fewer_explains_stand` |
| 6 | only one hypothesis can lead | `tests/test_direct.py::test_ties_share_leading_and_fewer_explains_stand` |
| 7 | eliminated and unchecked hypotheses set the bar for the leader | `tests/test_static.py::test_the_site_and_scripts_agree_on_success_payouts_and_the_judge` |
| 8 | checking a pair does not re-rank | `tests/test_direct.py::test_one_hypothesis_against_three_clues_every_combination[C]` |
| 9 | pinning a clue does not re-rank | `tests/test_direct.py::test_a_new_clue_makes_a_fully_tested_survivor_unchecked_again` |
| 10 | proposing does not rank | `tests/test_static.py::test_elimination_and_ranking_are_code_from_the_labels` |
| 11 | a new hypothesis starts as standing | `tests/test_static.py::test_the_site_and_scripts_agree_on_success_payouts_and_the_judge` |
| 12 | a later contradiction replaces the clue that eliminated | `tests/test_direct.py::test_the_clue_that_eliminated_a_hypothesis_is_named_and_stays_the_first` |
| 13 | a contradiction is not counted | `tests/test_direct.py::test_one_hypothesis_against_three_clues_every_combination[C]` |
| 14 | an explanation is not counted | `tests/test_direct.py::test_check_labels_one_pair_and_returns_the_label` |
| 15 | a silent pair is not counted | `tests/test_direct.py::test_one_hypothesis_against_three_clues_every_combination[S]` |
| 16 | the pair counter does not move | `tests/test_direct.py::test_check_labels_one_pair_and_returns_the_label` |
| 17 | a pair can be labelled twice | `tests/test_direct.py::test_a_pair_is_labelled_once` |
| 18 | a clue from another board can be tested | `tests/test_direct.py::test_check_refuses_unknown_ids_and_a_clue_from_another_board` |
| 19 | a resolved board can still be tested | `tests/test_direct.py::test_a_resolved_board_takes_no_more_checks` |
| 20 | validators do not compare the label | `tests/test_direct.py::test_the_validators_must_agree_on_the_label` |
| 21 | the label is not stored | `tests/test_direct.py::test_check_labels_one_pair_and_returns_the_label` |
| 22 | who asked is not recorded | `tests/test_direct.py::test_anyone_may_ask_and_the_caller_is_recorded_per_pair` |
| 23 | the hypothesis is not fenced | `tests/test_direct.py::test_the_prompt_carries_both_texts_fenced_and_nothing_else_of_the_board` |
| 24 | the observation is not fenced | `tests/test_direct.py::test_the_prompt_carries_both_texts_fenced_and_nothing_else_of_the_board` |
| 25 | the fence deletes instead of replacing | `tests/test_direct.py::test_the_prompt_carries_both_texts_fenced_and_nothing_else_of_the_board` |
| 26 | a label outside the three is accepted | `tests/test_static.py::test_the_site_and_scripts_agree_on_success_payouts_and_the_judge` |
| 27 | a formatting slip is never retried | `tests/test_direct.py::test_a_formatting_slip_is_retried_once_then_refused` |
| 28 | a clue costs any amount at least one GEN | `tests/test_direct.py::test_pin_costs_exactly_one_gen[1000000000000000001]` |
| 29 | a seventh clue is accepted | `tests/test_direct.py::test_a_board_holds_at_most_six_clues` |
| 30 | a seventh hypothesis is accepted | `tests/test_direct.py::test_a_board_holds_at_most_six_hypotheses` |
| 31 | an author may propose three | `tests/test_direct.py::test_one_author_may_propose_two_not_three_on_a_board` |
| 32 | the two-per-author cap counts across boards | `tests/test_direct.py::test_one_author_may_propose_two_not_three_on_a_board` |
| 33 | the bond has no floor | `tests/test_direct.py::test_the_bond_is_at_least_three_gen[2999999999999999999]` |
| 34 | a bond of exactly the floor is refused | `tests/test_direct.py::test_pin_is_allowed_on_a_locked_board_but_not_a_resolved_one` |
| 35 | a locked board takes new hypotheses | `tests/test_direct.py::test_a_locked_board_takes_no_new_hypothesis` |
| 36 | a resolved board takes new clues | `tests/test_direct.py::test_pin_is_allowed_on_a_locked_board_but_not_a_resolved_one` |
| 37 | a clue is recorded under the owner, not the pinner | `tests/test_direct.py::test_pin_holds_one_gen_and_records_who_pinned` |
| 38 | a hypothesis is recorded under the owner, not the proposer | `tests/test_direct.py::test_propose_holds_the_bond_and_records_the_author` |
| 39 | the bond is not what was sent | `tests/test_direct.py::test_propose_holds_the_bond_and_records_the_author` |
| 40 | the resolve window is not 7 days | `tests/test_direct.py::test_open_board_sets_owner_title_window_and_state` |
| 41 | the window is not set at opening | `tests/test_direct.py::test_open_board_sets_owner_title_window_and_state` |
| 42 | the title limit is 81 | `tests/test_direct.py::test_open_board_refuses_bad_titles[xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx]` |
| 43 | the text limit is 201 | `tests/test_direct.py::test_pin_refuses_bad_texts[text2]` |
| 44 | a text may span lines | `tests/test_direct.py::test_open_board_refuses_bad_titles[two\nlines]` |
| 45 | an empty text is accepted | `tests/test_direct.py::test_open_board_refuses_bad_titles[]` |
| 46 | anyone can lock a board | `tests/test_direct.py::test_only_the_owner_locks_and_only_an_open_board` |
| 47 | a locked board can be locked again | `tests/test_direct.py::test_only_the_owner_locks_and_only_an_open_board` |
| 48 | a board resolves twice | `tests/test_direct.py::test_a_board_resolves_once` |
| 49 | anyone resolves before the window ends | `tests/test_direct.py::test_only_the_owner_resolves_before_the_window_ends` |
| 50 | after the window anyone may pick any survivor | `tests/test_direct.py::test_after_seven_days_a_stranger_may_not_pick_a_non_leading_survivor` |
| 51 | an eliminated hypothesis can be the cause | `tests/test_direct.py::test_an_eliminated_hypothesis_cannot_be_the_cause` |
| 52 | a hypothesis of another board can be the cause | `tests/test_direct.py::test_resolve_refuses_a_hypothesis_of_another_board_and_unknown_ids` |
| 53 | the window ends one second late | `tests/test_direct.py::test_after_seven_days_anyone_may_resolve_in_favour_of_a_leading_hypothesis` |
| 54 | zero resolves before the window ends | `tests/test_direct.py::test_with_no_leader_after_the_window_anyone_may_resolve_with_zero_and_every_bond_returns` |
| 55 | zero resolves while a hypothesis is leading | `tests/test_direct.py::test_zero_is_refused_while_a_hypothesis_is_leading` |
| 56 | eliminated bonds are not pooled | `tests/test_direct.py::test_resolve_pays_the_eliminated_bonds_to_the_chosen_author_and_returns_the_rest` |
| 57 | eliminated bonds are pooled even when nobody won | `tests/test_direct.py::test_zero_with_eliminated_bonds_returns_them_since_nobody_won` |
| 58 | the pool goes to the owner | `tests/test_direct.py::test_resolve_pays_the_eliminated_bonds_to_the_chosen_author_and_returns_the_rest` |
| 59 | a surviving bond is not returned | `tests/test_direct.py::test_resolve_pays_the_eliminated_bonds_to_the_chosen_author_and_returns_the_rest` |
| 60 | a clue deposit goes to the owner | `tests/test_direct.py::test_clue_deposits_return_to_each_pinner_when_several_people_pinned` |
| 61 | a bond is not released from the held total | `tests/test_direct.py::test_resolve_pays_the_eliminated_bonds_to_the_chosen_author_and_returns_the_rest` |
| 62 | a deposit is not released from the held total | `tests/test_direct.py::test_resolve_pays_the_eliminated_bonds_to_the_chosen_author_and_returns_the_rest` |
| 63 | the chosen cause is not recorded | `tests/test_direct.py::test_resolve_pays_the_eliminated_bonds_to_the_chosen_author_and_returns_the_rest` |
| 64 | the board stays open after resolving | `tests/test_direct.py::test_pin_is_allowed_on_a_locked_board_but_not_a_resolved_one` |
| 65 | who resolved is not recorded | `tests/test_direct.py::test_after_seven_days_anyone_may_resolve_in_favour_of_a_leading_hypothesis` |
| 66 | withdraw does not clear the balance | `tests/test_direct.py::test_withdraw_pays_the_caller_everything_at_the_top_level_and_only_once` |
| 67 | withdraw pays one wei too much | `tests/test_direct.py::test_withdraw_pays_the_caller_everything_at_the_top_level_and_only_once` |
| 68 | withdraw of nothing is allowed | `tests/test_direct.py::test_withdraw_pays_the_caller_everything_at_the_top_level_and_only_once` |
| 69 | a credit is not added to what is owed | `tests/test_direct.py::test_resolve_pays_the_eliminated_bonds_to_the_chosen_author_and_returns_the_rest` |
| 70 | a withdrawal is not taken from what is owed | `tests/test_direct.py::test_withdraw_pays_the_caller_everything_at_the_top_level_and_only_once` |
| 71 | a withdrawal is not added to what was paid | `tests/test_direct.py::test_withdraw_pays_the_caller_everything_at_the_top_level_and_only_once` |
| 72 | a hold is not added to what was received | `tests/test_direct.py::test_pin_holds_one_gen_and_records_who_pinned` |
| 73 | a hold is not added to what is held | `tests/test_direct.py::test_pin_holds_one_gen_and_records_who_pinned` |
| 74 | a release is not taken from the board | `tests/test_direct.py::test_resolve_pays_the_eliminated_bonds_to_the_chosen_author_and_returns_the_rest` |
| 75 | a release is not taken from the total | `tests/test_direct.py::test_resolve_pays_the_eliminated_bonds_to_the_chosen_author_and_returns_the_rest` |
